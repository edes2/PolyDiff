import 'package:get/get.dart';
import 'package:mobile/classes/game.dart';
import 'package:mobile/classes/user.dart';
import 'package:mobile/services/communication_service.dart';
import 'package:mobile/services/socket_service.dart';

class GameManagerService extends GetxService {
  CommunicationService communicationService = Get.find<CommunicationService>();
  SocketClientService socketService = Get.find<SocketClientService>();

  UserProfile user = UserProfile(
    uid: '',
    username: '',
    email: '',
  );

  List<Vec2> cheatArray = [];
  Rx<PlayingInfo> playingInfo = PlayingInfo(
    cardInfo: CardInfo(
      id: '',
      name: '',
      diffCount: 0,
      difficulty: Difficulty.facile,
    ),
    mode: '',
    roomId: '',
    ownerId: '',
    players: [],
  ).obs;

  RxString timerString = '00:00'.obs;

  var gameEnded = false.obs;
  var winnerUid = ''.obs;

  GameManagerService() {
    initializeSockets();
  }

  void initializeSockets() {
    // TODO: manage memory leak

    socketService.socket.on('timer', (timerValue) {
      timerString.value = timerValue;
    });
    socketService.socket.on('updateDiffFoundCount', (data) {
      updateDiffCount(data);
    });
  }

  void resetSockets() {
    socketService.socket.off('timer');
    socketService.socket.off('errorClick');
    socketService.socket.off('differenceFoundClick');
    socketService.socket.off('updateDiffFoundCount');
    socketService.socket.off('endGame');
    gameEnded.value = false;
  }

  void updateDiffCount(dynamic data) {
    for (var userDiff in data) {
      String userId = userDiff[0];
      Map<String, dynamic> diffData = userDiff[1];
      int diffCount = diffData['count'];

      var foundPlayer = playingInfo.value.players
          .firstWhereOrNull((player) => player.user.uid == userId);
      if (foundPlayer != null) {
        foundPlayer.diffCount.value = diffCount; // Update the diffCount
      }
    }
  }

  Future<PlayingInfo?> initializeGameSession(
      String ownerId, UserProfile user) async {
    try {
      this.user = user;
      final PlayingInfo? playingInfo = await fetchPlayingInfo(ownerId);
      cheatArray = await communicationService.getCheat(ownerId);
      print('game manager cheat array: ' + cheatArray.length.toString());

      return playingInfo;
    } catch (e) {
      print(e);
      return null;
    }
  }

  Future<PlayingInfo?> fetchPlayingInfo(String ownerId) async {
    try {
      var fetchedPlayingInfo =
          await communicationService.getPlayingInfo(ownerId);

      playingInfo.value = fetchedPlayingInfo;
      return fetchedPlayingInfo;
    } catch (e) {
      print(e);
      return null;
    }
  }

  Future<List<String>> getImageById(String gameId) async {
    if (gameId.isNotEmpty) {
      try {
        return await communicationService.getImageById(gameId);
      } catch (e) {
        print(e);
        return [];
      }
    } else {
      return [];
    }
  }

  Future<String> getDiffImageById(String gameId) async {
    if (gameId.isNotEmpty) {
      try {
        return await communicationService.getDiffImageById(gameId);
      } catch (e) {
        print(e);
        return '';
      }
    } else {
      return '';
    }
  }
}
