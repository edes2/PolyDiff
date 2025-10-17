import 'package:mobile/classes/game.dart';

class LimitedJoinable {
  String roomId;
  List<Player> players;
  String ownerId;
  String mode;

  LimitedJoinable({
    required this.roomId,
    required this.players,
    required this.ownerId,
    required this.mode,
  });

  factory LimitedJoinable.fromJson(Map<String, dynamic> json) {
    var playersList = json['players'] as List;
    List<Player> players = playersList.map((i) => Player.fromJson(i)).toList();

    return LimitedJoinable(
      roomId: json['roomId'],
      players: players,
      ownerId: json['ownerId'],
      mode: json['mode'],
    );
  }
}
