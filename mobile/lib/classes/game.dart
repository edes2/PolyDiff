import 'package:get/get.dart';
import 'package:mobile/classes/user.dart';

class Game {
  final String cardId;
  final String imageUrl;
  final String name;
  final int diffCount;
  final Difficulty difficulty;
  final double? rating;
  final int? numberOfRatings;

  Game(
      {required this.cardId,
      required this.imageUrl,
      required this.name,
      required this.diffCount,
      required this.difficulty,
      required this.rating,
      required this.numberOfRatings});
}

class GameStartInfo {
  final String cardId;
  final int gameDuration; // in seconds
  final bool allowCheat;

  GameStartInfo(
      {required this.cardId,
      required this.gameDuration,
      required this.allowCheat});
}

class LimitedStartInfo {
  final int timeBonus;
  final int gameDuration; // in seconds
  final bool allowCheat;

  LimitedStartInfo(
      {required this.timeBonus,
      required this.gameDuration,
      required this.allowCheat});
}

enum Difficulty { facile, difficile }

class Vec2 {
  double x;
  double y;

  Vec2({required this.x, required this.y});
  Map<String, dynamic> toJson() {
    return {
      'x': x,
      'y': y,
    };
  }

  static fromJson(jsonDecode) {
    return Vec2(
      x: (jsonDecode['x'] as num).toDouble(),
      y: (jsonDecode['y'] as num).toDouble(),
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is Vec2 && other.x == x && other.y == y;
  }

  @override
  int get hashCode => x.hashCode ^ y.hashCode;
}

class ClickValidation {
  final String side;
  final Vec2 position;

  ClickValidation({required this.side, required this.position});
}

class CardInfo {
  String id;
  String name;
  int diffCount;
  Difficulty difficulty;

  CardInfo({
    required this.id,
    required this.name,
    required this.diffCount,
    required this.difficulty,
  });

  static fromJson(jsonDecode) {
    return CardInfo(
      id: jsonDecode['id'],
      name: jsonDecode['name'],
      diffCount: jsonDecode['diffCount'],
      difficulty: jsonDecode['difficulty'] == 'Facile'
          ? Difficulty.facile
          : Difficulty.difficile,
    );
  }
}

class PlayingInfo {
  CardInfo cardInfo;
  String mode;
  String roomId;
  String ownerId;
  List<PlayerInGame> players;

  PlayingInfo({
    required this.cardInfo,
    required this.mode,
    required this.roomId,
    required this.ownerId,
    required this.players,
  });

  static PlayingInfo fromJson(jsonDecode) {
    return PlayingInfo(
      cardInfo: CardInfo.fromJson(jsonDecode['cardInfo']),
      mode: jsonDecode['mode'],
      roomId: jsonDecode['roomId'],
      ownerId: jsonDecode['ownerId'],
      players: jsonDecode['players']
          .map((p) => PlayerInGame.fromJson(p))
          .toList()
          .cast<PlayerInGame>(),
    );
  }
}

class PlayerInGame {
  final UserProfile user;
  RxInt diffCount;

  PlayerInGame({
    required this.user,
    required int diffCount,
  }) : diffCount = RxInt(diffCount);

  static PlayerInGame fromJson(Map<String, dynamic> json) {
    return PlayerInGame(
      user: UserProfile.fromJson(json['user']),
      diffCount: json['diffCount'],
    );
  }
}

class Player {
  final String uid;
  final String username;

  Player({required this.uid, required this.username});

  factory Player.fromJson(Map<String, dynamic> json) {
    return Player(
      uid: json['uid'],
      username: json['username'],
    );
  }
}

class ErrorSoundSingleton {
  static final ErrorSoundSingleton _singleton = ErrorSoundSingleton._internal();
  factory ErrorSoundSingleton() {
    return _singleton;
  }
  ErrorSoundSingleton._internal();
  String selectedErrorPath = 'audio/errorSound1.wav';
}

class DifSoundSingleton {
  static final DifSoundSingleton _singleton = DifSoundSingleton._internal();
  factory DifSoundSingleton() {
    return _singleton;
  }
  DifSoundSingleton._internal();
  String selectedDifPath = 'audio/differenceFoundSound1.wav';
}


// WaitingRoomDTO in server -- socket.on('updateWaitingRooms')
class JoinableGame {
  final String cardId;
  final List<Player> players;
  final String ownerId;
  final String mode;

  JoinableGame({
    required this.cardId,
    required this.players,
    required this.ownerId,
    required this.mode,
  });

  factory JoinableGame.fromJson(Map<String, dynamic> json) {
    var playersJson = json['players'] as List;
    List<Player> playersList =
        playersJson.map((p) => Player.fromJson(p)).toList();

    return JoinableGame(
      cardId: json['cardId'],
      players: playersList,
      ownerId: json['ownerId'],
      mode: json['mode'],
    );
  }
}

class ImageSet {
  final String cardId;
  final String leftUri;
  final String rightUri;

  ImageSet(
      {required this.cardId, required this.leftUri, required this.rightUri});

  static ImageSet fromJson(jsonDecode) {
    return ImageSet(
      cardId: jsonDecode['cardId'],
      leftUri: jsonDecode['leftUri'],
      rightUri: jsonDecode['rightUri'],
    );
  }
}

class OneDifferenceImageSet extends ImageSet {
  final List<Vec2> difference;

  OneDifferenceImageSet({
    required String cardId,
    required String leftUri,
    required String rightUri,
    required this.difference,
  }) : super(cardId: cardId, leftUri: leftUri, rightUri: rightUri);

  static OneDifferenceImageSet fromJson(jsonDecode) {
    return OneDifferenceImageSet(
      cardId: jsonDecode['cardId'],
      leftUri: jsonDecode['leftUri'],
      rightUri: jsonDecode['rightUri'],
      difference: jsonDecode['difference']
          .map((d) => Vec2.fromJson(d))
          .toList()
          .cast<Vec2>(),
    );
  }
}

enum MusicType {
  lofi,
  classical,
  jazz,
  nature,
}

class Music {
  final MusicType type;
  final String name;
  final String
      src; // la musique en base64, prête à être load dans un objet Audio

  Music({
    required this.type,
    required this.name,
    required this.src,
  });
}
