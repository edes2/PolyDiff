class EnrichedGameHistory {
  final String date;
  final String startingTime;
  final String duration;
  final String gameMode;
  final List<String> playersId;
  final List<String> playersUsername;
  final String? winnerId;
  final List<String>? rageQuittersId;
  final List<MapEntry<String, int>>? differenceCounts;

  EnrichedGameHistory({
    required this.date,
    required this.startingTime,
    required this.duration,
    required this.gameMode,
    required this.playersId,
    required this.playersUsername,
    this.winnerId,
    this.rageQuittersId,
    this.differenceCounts,
  });

  factory EnrichedGameHistory.fromJson(Map<String, dynamic> json) {
    return EnrichedGameHistory(
      date: json['date'],
      startingTime: json['startingTime'],
      duration: json['duration'],
      gameMode: json['gameMode'],
      playersId: List<String>.from(json['playersId']),
      playersUsername: List<String>.from(json['playersUsername']),
      winnerId: json['winnerId'],
      rageQuittersId: json['rageQuittersId'] != null
          ? List<String>.from(json['rageQuittersId'])
          : null,
      differenceCounts: json['differenceCounts'] != null
          ? (json['differenceCounts'] as List)
              .map((item) => MapEntry(item[0] as String, item[1] as int))
              .toList()
          : null,
    );
  }

  @override
  String toString() {
    return 'EnrichedGameHistory{date: $date, startingTime: $startingTime, duration: $duration, gameMode: $gameMode, playersId: $playersId, playersUsername: $playersUsername, winnerId: $winnerId, rageQuittersId: $rageQuittersId, differenceCounts: $differenceCounts}';
  }
}
