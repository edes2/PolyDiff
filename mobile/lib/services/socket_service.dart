import 'dart:async';

import 'package:audioplayers/audioplayers.dart';
import 'package:get/get.dart';
import 'package:mobile/classes/game.dart';
import 'package:mobile/constants/constants.dart' as constants;
import 'package:socket_io_client/socket_io_client.dart' as IO;

class SocketClientService extends GetxService {
  late IO.Socket socket = IO.io('${constants.serverPath}/', {
    'transports': ['websocket'],
    'upgrade': false,
    'autoConnect': false,
  });
  // final GameManagerService gameManagerService = Get.find<GameManagerService>();

  AudioPlayer audioPlayer = AudioPlayer();

  //bool canClick = true;

  SocketClientService() {
    socket.connect();
  }

  Future<bool> initConnection(String token) async {
    if (!socket.connected) {
      print("Init stopped: not connected");
      return false;
    }
    final completer = Completer<bool>();
    socket.on('authentificationComplete', (data) {
      completer.complete(data);
    });

    socket.emit('authentification', token);

    return completer.future;
  }

  void createClassicGame(GameStartInfo gameStartInfo,
      void Function(Map<String, dynamic>) callback) {
    socket.emitWithAck('startMultiGameCreation', {
      'mode': 'Classique',
      'duration': gameStartInfo.gameDuration,
      'cheatingAllowed': gameStartInfo.allowCheat,
      'cardId': gameStartInfo.cardId,
    }, ack: (data) {
      // Assuming data['players'] is List<dynamic>
      List<dynamic> dynamicList = data['players'];
      // Convert List<dynamic> to List<String>
      List<String> stringList =
          dynamicList.map((item) => item.toString()).toList();

      callback({
        'players': stringList,
        'roomId': data['roomId']
      }); // Call the passed callback function with the data
    });
  }

  void createLimitedGame(LimitedStartInfo limitedStartInfo,
      void Function(Map<String, dynamic>) callback) {
    print('in create limit game');
    socket.emitWithAck('startMultiGameCreation', {
      'mode': 'Temps limité',
      'duration': limitedStartInfo.gameDuration,
      'cheatingAllowed': limitedStartInfo.allowCheat,
      'timeBonus': limitedStartInfo.timeBonus,
    }, ack: (data) {
      List<dynamic> dynamicList = data['players'];
      List<String> stringList =
          dynamicList.map((item) => item.toString()).toList();

      callback({
        'players': stringList,
        'roomId': data['roomId']
      }); // Call the passed callback function with the data
    });
  }

  void joinMultiGame(
      String ownerId, void Function(Map<String, dynamic>) callback) {
    socket.emitWithAck('joinMultiGame', ownerId, ack: (data) {
      if (data['success']) {
        callback({'roomId': data['roomId']});
      }
    });
  }

  void clickHitDetect(ClickValidation clickValidation) {
    print('sending click at:' +
        clickValidation.position.x.toString() +
        'y: ' +
        clickValidation.position.y.toString());
    int roundedX = clickValidation.position.x.round();
    int roundedY = clickValidation.position.y.round();
    socket.emit(
      'mouseClick',
      {
        'side': clickValidation.side,
        'position': {
          'x': roundedX,
          'y': roundedY,
        },
      },
    );
  }

  void startClassicGame() {
    socket.emit('startMultiGame');
  }

  void deleteWaitingRoom(String ownerId) {
    socket.emit('DeleteWaitingRoom', {'ownerId': ownerId});
  }

  void quitWaitingRoom(String ownerId, String playerId) {
    socket.emit('QuitWaitingRoom', {'ownerId': ownerId, 'playerId': playerId});
  }

  void abandonGame() {
    socket.emit('abandonGame');
  }

  void disconnect() {
    socket.disconnect();
  }
}
