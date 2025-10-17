import 'package:mobile/classes/enums.dart';

class JoinerWaitingRoomArgs {
  final String ownerId;
  final List<String> playerList;
  final GameMode gameMode;

  JoinerWaitingRoomArgs(
      {required this.ownerId,
      required this.playerList,
      required this.gameMode});
}

class CreatorWaitingRoomArgs {
  final String ownerId;
  final GameMode gameMode;

  CreatorWaitingRoomArgs({required this.ownerId, required this.gameMode});
}
