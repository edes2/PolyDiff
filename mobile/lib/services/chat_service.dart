import 'dart:convert';

import 'package:audioplayers/audioplayers.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:mobile/classes/channel.dart';
import 'package:mobile/constants/constants.dart' as constants;
import 'package:socket_io_client/socket_io_client.dart' as IO;

class ChatService extends GetxService {
  AudioPlayer audioPlayer = AudioPlayer();

  final messages = [].obs;
  RxBool hasUnreadMessage = false.obs;
  RxList openChannelList = [].obs;
  RxList<JoinableChannel> joinedChannelList = <JoinableChannel>[].obs;
  String currentChannel = 'General';
  String privateChannel = '';

  List<String> bannedWords = [];

  final String giphyApiKey = 'zlqIjXLSKG3CHYJfO24i2rz4JEN7i2K2';
  final String giphyApiURL = 'https://api.giphy.com/v1/gifs';

  IO.Socket socket = IO.io(constants.fastApiPath, {
    'path': '/ws',
    'transports': ['websocket'],
    'upgrade': false,
    'autoConnect': false,
  });

  ChatService() {
    socket.connect();
    getGeneralHistory();
    joinedChannelList.insert(0, JoinableChannel(channelName: 'General'));
    getAllChannels();
    socket.emit('joinChannel', {'channelId': 'General'});
    initializeSockets();
    fetchBannedWords();
  }

  @override
  void onClose() {
    // Add your cleanup logic here
    socket.off('receive_message');
    socket.off('receive_notification');
    socket.off('channel_created');
    socket.off('deleted_channel');

    super.onClose();
  }

  Future<void> getChatHistory(String channel) async {
    if (channel == 'General') {
      getGeneralHistory();
      return;
    }
    messages.value = [];
    http.Response response;
    if (channel.startsWith('PrivateChat: ')) {
      response = await http.get(
          Uri.parse('${constants.fastApiPath}/api/private/channels/$channel'));
    } else {
      response = await http.get(
          Uri.parse('${constants.fastApiPath}/api/global/channels/$channel'));
    }

    final chatHistory = jsonDecode(response.body);
    messages.addAll(chatHistory.cast<Map<String, dynamic>>());
  }

  Future<void> getGeneralHistory() async {
    messages.value = [];
    final response =
        await http.get(Uri.parse('${constants.fastApiPath}/api/general'));
    final chatHistory = jsonDecode(response.body);
    messages.addAll(chatHistory.cast<Map<String, dynamic>>());
  }

  Future<void> getAllChannels() async {
    final allResponse = await http
        .get(Uri.parse('${constants.fastApiPath}/api/global/channels'));

    final channels = jsonDecode(allResponse.body);
    openChannelList.addAll(channels);
  }

  Future<void> getJoinedChannels(String uid) async {
    final allResponse = await http
        .get(Uri.parse('${constants.fastApiPath}/api/global/users/$uid'));

    final channels = jsonDecode(allResponse.body);
    for (var channel in channels) {
      joinedChannelList.add(JoinableChannel(channelName: channel));
      print('Joining channel $channel');
      socket.emit('joinChannel', {'channelId': channel});
    }
    openChannelList.removeWhere((element) => joinedChannelList
        .any((joinedChannel) => joinedChannel.channelName == element));
  }

  Future<List<String>> searchGifs(String query) async {
    final url = Uri.parse(
        '$giphyApiURL/search?api_key=$giphyApiKey&q=$query&limit=10&offset=0&rating=G&lang=en');
    final response = await http.get(url);

    if (response.statusCode == 200) {
      final List<dynamic> gifs = json.decode(response.body)['data'];
      return gifs
          .map((gif) => gif['images']['fixed_height_small']['url'].toString())
          .toList();
    } else {
      throw Exception('Failed to load GIFs');
    }
  }

  Future<void> fetchBannedWords() async {
    var url = Uri.parse(
        'https://raw.githubusercontent.com/thisandagain/washyourmouthoutwithsoap/develop/data/build.json');
    var response = await http.get(url);

    if (response.statusCode == 200) {
      var badwords = jsonDecode(response.body);
      final bannedWordsEn = List<String>.from(badwords['en']);
      final bannedWordsFr = List<String>.from(badwords['fr']);
      bannedWordsEn.addAll(bannedWordsFr);
      bannedWords = bannedWordsEn;
    } else {
      throw Exception('Failed to load banned words');
    }
  }

  initializeSockets() {
    socket.on('receive_message', ((data) {
      if (data['chatId'] == currentChannel) {
        Map<String, dynamic> msg = {
          'content': data['message']['content'],
          'emitterId': data['message']['emitterId'],
          'timestamp': data['message']['timestamp'],
          'emitterName': data['message']['emitterName'],
          'type': data['message']['type']
        };
        messages.add(msg);
      }
    }));

    socket.on('receive_notification', ((chatId) {
      print('$chatId received notification');
      if (currentChannel != chatId) {
        audioPlayer.play(AssetSource('audio/message.mp3'));
        hasUnreadMessage.value = true;
        for (JoinableChannel channel in joinedChannelList) {
          if (channel.channelName == chatId) {
            channel.unread.value = true;
            break;
          }
        }
      }
    }));

    socket.on('channel_created', ((channelId) {
      print('chanel created');
      openChannelList.insert(0, channelId);
    }));

    socket.on('deleted_channel', ((channelId) {
      openChannelList.remove(channelId);
      joinedChannelList
          .removeWhere((channel) => channel.channelName == channelId);
    }));
  }

  sendMessage(String message, String uid, String type) {
    socket.emit('send_message', {
      'message': {'content': message, 'emitterId': uid, 'type': type},
      'chatId': currentChannel
    });
  }

  openChannel(String channelId) async {
    print('opening channel $channelId');
    for (JoinableChannel channel in joinedChannelList) {
      if (channel.channelName == channelId) {
        channel.unread.value = false;
        break;
      }
    }
    await getChatHistory(channelId);
    currentChannel = channelId;
  }

  createNewChannel(String channelId) {
    socket.emit('newChat', channelId);
  }

  deleteChannel(String channelId) {
    socket.emit('deleteChannel', {'channelId': channelId});
  }

  joinNewChannel(String channelId, String uid) {
    socket.emit('joinNewChannel', {'userId': uid, 'channelId': channelId});
    openChannelList.remove(channelId);
    joinedChannelList.insert(0, JoinableChannel(channelName: channelId));
  }

  leaveChannel(String channelId, String uid) {
    socket.emit('leaveChannel', {'userId': uid, 'channelId': channelId});
    joinedChannelList
        .removeWhere((channel) => channel.channelName == channelId);
    openChannelList.insert(0, channelId);
  }

  // Private chat:
  createPrivateChannel(String channelId, String uid) {
    print('$uid has join $channelId');
    socket.emit('joinNewChannel', {'userId': uid, 'channelId': channelId});
    joinedChannelList.insert(0, JoinableChannel(channelName: channelId));
    privateChannel = channelId;
  }

  leavePrivateChannel(String uid) {
    print('$uid has left $privateChannel');
    socket.emit('leaveChannel', {'userId': uid, 'channelId': privateChannel});
    joinedChannelList
        .removeWhere((channel) => channel.channelName == privateChannel);
    privateChannel = '';
  }
}
