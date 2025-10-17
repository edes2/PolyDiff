import 'dart:convert';

import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:mobile/classes/game.dart';
import 'package:mobile/constants/constants.dart' as constants;
import 'package:mobile/services/authentication.dart';
// /global/chat

class CommunicationService extends GetxService {
  static CommunicationService get to => Get.find();

  final AuthenticationService authService = Get.find<AuthenticationService>();

  CommunicationService();

  getMiniatureById(String id) async {
    final token = await authService.getToken();
    if (token == null) return;
    final response = await http.get(
        Uri.parse('${constants.serverPath}/api/images/miniature/$id'),
        headers: {'Authorization': 'Bearer $token'});

    String image = jsonDecode(response.body);
    final split = image.split(',');
    final pureBase64Image = split.length > 1 ? split[1] : split[0];
    return pureBase64Image;
  }

  getImageById(String gameId) async {
    final token = await authService.getToken();
    if (token == null) return;
    final response = await http.get(
        Uri.parse('${constants.serverPath}/api/images/$gameId'),
        headers: {'Authorization': 'Bearer $token'});

    dynamic rawImage = jsonDecode(response.body);
    final splitLeftImage = rawImage['leftUri'].split(',');
    String pureBase64LeftImageURL =
        splitLeftImage.length > 1 ? splitLeftImage[1] : splitLeftImage[0];

    final splitRightImage = rawImage['rightUri'].split(',');
    String pureBase64RightImageURL =
        splitRightImage.length > 1 ? splitRightImage[1] : splitRightImage[0];
    return [pureBase64LeftImageURL, pureBase64RightImageURL];
  }

  getDiffImageById(String gameId) async {
    final token = await authService.getToken();
    if (token == null) return;
    final response = await http.get(
        Uri.parse('${constants.serverPath}/api/images/diff/$gameId'),
        headers: {'Authorization': 'Bearer $token'});

    dynamic rawDiffImage = jsonDecode(response.body);
    final splitDiffImage = rawDiffImage.split(',');
    final pureBase64DiffImage =
        splitDiffImage.length > 1 ? splitDiffImage[1] : splitDiffImage[0];
    return pureBase64DiffImage;
  }

  getPlayingInfo(String ownerId) async {
    final token = await authService.getToken();
    if (token == null) return;
    final response = await http.get(
        Uri.parse('${constants.serverPath}/api/games/playing-info/$ownerId'),
        headers: {'Authorization': 'Bearer $token'});
    if (response.statusCode == 200) {
      PlayingInfo playingInfo = PlayingInfo.fromJson(jsonDecode(response.body));
      return playingInfo;
    } else {
      print('Failed to load playing info: ${response.statusCode}');
    }
  }

  getCheat(String ownerId) async {
    final token = await authService.getToken();
    if (token == null) return;
    final response = await http.get(
        Uri.parse('${constants.serverPath}/api/games/cheat/$ownerId'),
        headers: {'Authorization': 'Bearer $token'});

    if (response.statusCode == 200) {
      final cheatDiffs = jsonDecode(response.body);
      List<Vec2> cheats = [];
      for (var diff in cheatDiffs) {
        cheats.add(Vec2.fromJson(diff));
      }
      return cheats;
    } else {
      print('Failed to load cheat: ${response.statusCode}');
    }
  }

  putRating(String cardId, double rating) async {
    final token = await authService.getToken();
    if (token == null) return;
    final response = await http.put(
        Uri.parse('${constants.serverPath}/api/cards/rating'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json'
        },
        body: jsonEncode({'cardId': cardId, 'newRating': rating}));
    print(response.statusCode);
  }
}
