import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/services.dart' show rootBundle;
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:mobile/classes/history.dart';
import 'package:mobile/constants/constants.dart' as constants;
import 'package:mobile/services/authentication.dart';

class ProfileConfigService extends GetxService {
  static ProfileConfigService get to => Get.find();

  List<String> defaultAvatars = [
    'assets/images/default-avatar.png',
    'assets/images/avatar_man_1.png',
    'assets/images/avatar_man_2.png',
    'assets/images/avatar_woman_1.png',
    'assets/images/avatar_woman_2.png',
  ];

  @override
  void onInit() async {
    super.onInit();
  }

  Future<bool> updateLanguagePreference(
      String languagePreference, String uid) async {
    try {
      final AuthenticationService authService =
          Get.find<AuthenticationService>();

      final token = await authService.getToken();
      if (token == null) {
        return false;
      }
      final response = await http.put(
          Uri.parse('${constants.serverPath}/api/users/profile/language/$uid'),
          body: {'language': languagePreference},
          headers: {'Authorization': 'Bearer $token'});

      if (response.statusCode != 200) {
        throw Exception('Failed to update language preference');
      }
      return true;
    } catch (e) {
      print(e);
      return false;
    }
  }

  Future<bool> updateThemePreference(String themePreference, String uid) async {
    try {
      final AuthenticationService authService =
          Get.find<AuthenticationService>();

      final token = await authService.getToken();
      if (token == null) {
        return false;
      }
      final response = await http.put(
        Uri.parse('${constants.serverPath}/api/users/profile/theme/$uid'),
        body: {'theme': themePreference},
        headers: {'Authorization': 'Bearer $token'},
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to update theme preference');
      }
      return true;
    } catch (e) {
      print(e);
      return false;
    }
  }

  Future<bool> updateUsername(String userName) async {
    try {
      final AuthenticationService authService =
          Get.find<AuthenticationService>();

      final token = await authService.getToken();
      if (token == null) {
        return false;
      }
      final response = await http.post(
          Uri.parse('${constants.serverPath}/api/users/username'),
          body: {'username': userName},
          headers: {'Authorization': 'Bearer $token'});

      if (response.statusCode != 200) {
        throw Exception('Failed to update username');
      }
      return true;
    } catch (e) {
      print(e);
      return false;
    }
  }

  Future<bool> putAvatar(String uid, String avatarUrl) async {
    try {
      final AuthenticationService authService =
          Get.find<AuthenticationService>();

      final token = await authService.getToken();
      if (token == null) {
        return false;
      }
      final response = await http.put(
          Uri.parse('${constants.serverPath}/api/images/avatar'),
          body: {'uid': uid, 'avatarUrl': avatarUrl},
          headers: {'Authorization': 'Bearer $token'});
      if (response.statusCode != 200) {
        throw Exception('Failed to update avatar ${response.body}');
      }
      return true;
    } catch (e) {
      print(e);
      return false;
    }
  }

  Future<String?> getAvatar(String uid) async {
    try {
      final AuthenticationService authService =
          Get.find<AuthenticationService>();

      final token = await authService.getToken();
      if (token == null) {
        return null;
      }
      final response = await http.get(
          Uri.parse('${constants.serverPath}/api/images/avatar/$uid'),
          headers: {'Authorization': 'Bearer $token'});

      if (response.statusCode != 200) {
        throw Exception('Failed to get avatar');
      }
      dynamic imageAvatar = jsonDecode(response.body);
      final split = imageAvatar.split(',');
      String pureBase64Image = split.length > 1 ? split[1] : split[0];
      return 'data:image/png;base64,$pureBase64Image';
    } catch (e) {
      print(e);
      return null;
    }
  }

  Future<List<EnrichedGameHistory>> getHistory(String uid) async {
    try {
      final AuthenticationService authService =
          Get.find<AuthenticationService>();

      final token = await authService.getToken();
      if (token == null) {
        return [];
      }
      final response = await http.get(
          Uri.parse('${constants.serverPath}/api/games/history/player/$uid'),
          headers: {'Authorization': 'Bearer $token'});

      if (response.statusCode != 200) {
        throw Exception('Failed to get game History');
      }
      final List<dynamic> gameHistory = jsonDecode(response.body);
      print(gameHistory);
      return gameHistory
          .map<EnrichedGameHistory>(
              (game) => EnrichedGameHistory.fromJson(game))
          .toList();
    } catch (e) {
      print(e);
      return [];
    }
  }

  Future<List<dynamic>> getConnectionsHistory(String uid) async {
    try {
      final AuthenticationService authService =
          Get.find<AuthenticationService>();

      final token = await authService.getToken();
      if (token == null) {
        return [];
      }
      final response = await http.get(
          Uri.parse('${constants.serverPath}/api/users/connections/$uid'),
          headers: {'Authorization': 'Bearer $token'});
      if (response.statusCode != 200) {
        throw Exception('Failed to get connections History');
      }
      final List<dynamic> connectionsHistory = jsonDecode(response.body);
      return connectionsHistory;
    } catch (e) {
      print(e);
      return [];
    }
  }

  Future<String> getImageBase64(String imagePath) async {
    final ByteData bytes = await rootBundle.load(imagePath);
    final Uint8List list = bytes.buffer.asUint8List();
    final String base64AvatarUrl = base64Encode(list);
    return 'data:image/png;base64,$base64AvatarUrl';
  }

  String calculateAverageGameDuration(List<EnrichedGameHistory> history) {
    if (history.isEmpty) {
      return '0';
    }
    durationToSeconds(String duration) {
      final split = duration.split(':');
      return int.parse(split[0]) * 60 + int.parse(split[1]);
    }

    final totalDurationInSeconds = history
        .map((game) => game.duration)
        .map((duration) => durationToSeconds(duration))
        .reduce((value, element) => value + element);

    final averageDurationInSeconds = totalDurationInSeconds ~/ history.length;

    final averageMinutes = averageDurationInSeconds ~/ 60;
    final averageSeconds = averageDurationInSeconds % 60;

    final paddedMinutes = averageMinutes.toString().padLeft(2, '0');
    final paddedSeconds = averageSeconds.toString().padLeft(2, '0');
    return '$paddedMinutes:$paddedSeconds';
  }

  int calculateGamesPlayed(List<EnrichedGameHistory> history) {
    return history.length;
  }

  int calculateGamesWon(List<EnrichedGameHistory> history, String uid) {
    return history.where((game) => game.winnerId == uid).length;
  }

  double calculateAverageDiff(List<EnrichedGameHistory> history, String uid) {
    double totalDiff = 0.0;
    int totalGames = 0;
    history.forEach((game) {
      if (game.differenceCounts != null) {
        totalDiff += getDifferenceCountForUid(game.differenceCounts!, uid);
        totalGames++;
      }
    });
    return totalGames > 0
        ? totalDiff / totalGames
        : 0.0; // Avoid division by zero
  }

  int getDifferenceCountForUid(
      List<MapEntry<String, int>> differenceCounts, String uid) {
    var entry = differenceCounts.firstWhere(
      (element) => element.key == uid,
      orElse: () => MapEntry(uid, 0), // Return 0 if uid is not found
    );
    return entry.value;
  }
}
