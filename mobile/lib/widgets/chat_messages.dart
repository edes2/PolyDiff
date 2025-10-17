import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:mobile/classes/channel.dart';
import 'package:mobile/classes/user.dart';
import 'package:mobile/services/authentication.dart';
import 'package:mobile/services/chat_service.dart';
import 'package:mobile/services/profile_configuration.dart';
import 'package:mobile/widgets/cards/join_chanel.dart';
import 'package:mobile/widgets/cards/open_channel.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;

class ChatMessages extends StatefulWidget {
  final IO.Socket socket;
  final GlobalKey<ChatMessagesState> key;

  ChatMessages({required this.socket, required this.key}) : super(key: key);

  void scrollToBottom() {
    key.currentState?._scrollToBottom();
  }

  @override
  ChatMessagesState createState() => ChatMessagesState();
}

class ChatMessagesState extends State<ChatMessages> {
  ScrollController scrollController = ScrollController();
  final TextEditingController _createChannelController =
      TextEditingController();

  final chatService = Get.find<ChatService>();
  final ProfileConfigService profileConfigService =
      Get.find<ProfileConfigService>();
  String searchQuery = "";

  late UserProfile user =
      UserProfile(uid: '1', username: 'Lorem', email: 'lorem@ipsum.com');

  String avatarUrl = '';
  Map<String, String?> userAvatars = {};
  StreamSubscription?
      _messageSubscription; // Variable to store the subscription

  @override
  void initState() {
    super.initState();
    fetchUser();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _scrollToBottom();
    });
    _messageSubscription = chatService.messages.listen((_) {
      // Storing the subscription
      _scrollToBottom();
    });
  }

  @override
  void dispose() {
    scrollController.dispose();
    _messageSubscription?.cancel(); // Unsubscribe from the stream
    widget.socket.close(); // Close the socket connection
    super.dispose();
  }

  void _scrollToBottom() {
    if (scrollController.hasClients) {
      scrollController.animateTo(
        scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  void fetchUser() async {
    AuthenticationService authService = Get.find<AuthenticationService>();
    UserProfile? fetchedUser = await authService.fetchUser();
    if (fetchedUser != null) {
      setState(() {
        user = fetchedUser;
      });
      loadAvatarUrl();
    }
  }

  Future<String> fetchAvatar(String userId) async {
    if (!userAvatars.containsKey(userId) || userAvatars[userId] == null) {
      String? avatar = await profileConfigService.getAvatar(userId);
      userAvatars[userId] = avatar ?? 'assets/images/default-avatar.png';
    }
    return userAvatars[userId]!;
  }

  void loadAvatarUrl() async {
    final avatar = await profileConfigService.getAvatar(user.uid);
    setState(() {
      avatarUrl = avatar ?? '';
    });
  }

  @override
  Widget build(BuildContext context) {
    getFilteredOpenChannels() {
      return chatService.openChannelList
          .where((channel) => channel.toLowerCase().contains(searchQuery))
          .toList();
    }

    getFilteredJoinedChannels() {
      return chatService.joinedChannelList
          .where((channel) =>
              channel.channelName.toLowerCase().contains(searchQuery))
          .toList();
    }

    return Column(children: <Widget>[
      Expanded(
        flex: 1,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                children: <Widget>[
                  Expanded(
                    child: TextField(
                      decoration: InputDecoration(
                        labelText: "Chercher",
                        border: OutlineInputBorder(),
                      ),
                      onChanged: (value) {
                        setState(() {
                          searchQuery = value.toLowerCase();
                        });
                      },
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: TextField(
                      controller: _createChannelController,
                      decoration: InputDecoration(
                          labelText: "Creer",
                          border: const OutlineInputBorder(),
                          suffixIcon: IconButton(
                            icon: const Icon(Icons.add),
                            onPressed: () {
                              if (_createChannelController.text.isEmpty) return;

                              chatService.createNewChannel(
                                  _createChannelController.text);
                              _createChannelController.clear();
                            },
                          )),
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 20, thickness: 1),
            Expanded(
              child: Row(
                children: [
                  Expanded(
                    child: Obx(() => ListView.builder(
                          itemCount: getFilteredOpenChannels().length,
                          itemBuilder: (context, index) {
                            var channelName = getFilteredOpenChannels()[index];
                            return OpenChannelCard(
                              chatName: channelName,
                              onJoin: () async {
                                UserProfile user = UserProfile(
                                    uid: '1',
                                    username: 'Lorem',
                                    email: 'lorem@ipsum.com');

                                AuthenticationService authService =
                                    Get.find<AuthenticationService>();
                                UserProfile? fetchedUser =
                                    await authService.fetchUser();
                                if (fetchedUser != null) {
                                  user = fetchedUser;
                                }
                                chatService.joinNewChannel(
                                    channelName, user.uid);
                              },
                              onDelete: () {
                                chatService.deleteChannel(channelName);
                              },
                            );
                          },
                        )),
                  ),
                  const VerticalDivider(width: 1),
                  Expanded(
                    child: Obx(() => ListView.builder(
                          itemCount: getFilteredJoinedChannels().length,
                          itemBuilder: (context, index) {
                            JoinableChannel joinableChannel =
                                getFilteredJoinedChannels()[index];
                            return JoinedChannelCard(
                              channel: joinableChannel,
                              onOpen: () async {
                                await chatService
                                    .openChannel(joinableChannel.channelName);
                              },
                              onLeave: () async {
                                UserProfile user = UserProfile(
                                    uid: '1',
                                    username: 'Lorem',
                                    email: 'lorem@ipsum.com');

                                AuthenticationService authService =
                                    Get.find<AuthenticationService>();
                                UserProfile? fetchedUser =
                                    await authService.fetchUser();
                                if (fetchedUser != null) {
                                  user = fetchedUser;
                                }
                                chatService.leaveChannel(
                                    joinableChannel.channelName, user.uid);
                              },
                            );
                          },
                        )),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      const Divider(height: 1, color: Colors.grey),
      Expanded(
          flex: 1,
          child: Obx(() => chatService.messages.isEmpty
              ? Center(
                  child: Text('Pas de messages trouvés.'),
                )
              : ListView.builder(
                  itemCount: chatService.messages.length,
                  controller: scrollController,
                  itemBuilder: (BuildContext ctx, int index) {
                    final message = chatService.messages[index];
                    final isUser = message['emitterId'] == user.uid;
                    return _buildMessageBubble(message, isUser);
                  },
                )))
    ]);
  }

  Widget _buildMessageBubble(Map<String, dynamic> message, bool isUser) {
    final isGif = message['content'].endsWith('.gif&ct=g');
    final isImage = message['content'].startsWith('data:image/png;base64');
    final userId = message['emitterId'];
    final color = isUser ? Colors.blue : Colors.red;

    return Stack(
      alignment: isUser ? Alignment.topRight : Alignment.topLeft,
      clipBehavior: Clip.none,
      children: [
        Padding(
          padding: EdgeInsets.only(
            top: 8.0,
            right: isUser ? 40.0 : 0,
            left: isUser ? 0 : 40.0,
          ),
          child: Align(
            alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 25, vertical: 5),
              margin: const EdgeInsets.symmetric(horizontal: 25, vertical: 25),
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(15),
              ),
              child: Column(
                crossAxisAlignment:
                    isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                children: [
                  if (isGif)
                    Image.network(message['content'], fit: BoxFit.fitWidth),
                  if (!isGif && !isImage)
                    Text(
                      message['content'],
                      style: const TextStyle(color: Colors.white),
                    ),
                  if (isImage) ...[
                    const SizedBox(height: 10),
                    Image.memory(
                      base64Decode(message['content'].split(',')[1]),
                      fit: BoxFit.fitWidth,
                    ),
                  ],
                  // Timestamp and Emitter Name
                  Padding(
                    padding: const EdgeInsets.only(top: 4.0),
                    child: Text(
                      '${message['timestamp']} Envoyé par: ${message['emitterName']}',
                      style: TextStyle(color: Colors.white.withOpacity(0.6)),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        Positioned(
          top: 0,
          right: isUser ? 5 : null,
          left: isUser ? null : 5,
          child: FutureBuilder<String>(
            future: fetchAvatar(userId),
            builder: (BuildContext context, AsyncSnapshot<String> snapshot) {
              if (snapshot.connectionState == ConnectionState.done &&
                  snapshot.hasData) {
                return _buildAvatar(snapshot.data!);
              } else {
                return _buildAvatar('');
              }
            },
          ),
        ),
      ],
    );
  }

  Widget _buildAvatar(String base64Avatar) {
    if (base64Avatar.isNotEmpty && base64Avatar.contains(',')) {
      try {
        final bytes = base64Decode(base64Avatar.split(',')[1]);
        return CircleAvatar(
          backgroundImage: MemoryImage(bytes),
          radius: 32,
        );
      } catch (e) {
        print('Error decoding image: $e');
      }
    }
    return const CircleAvatar(
      backgroundImage: AssetImage('assets/images/default-avatar.png'),
      radius: 32,
    );
  }
}
