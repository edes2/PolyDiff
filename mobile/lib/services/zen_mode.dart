import 'dart:convert';

//import 'package:base64_audio_source/base64_audio_source.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
//import 'package:just_audio/just_audio.dart';
import 'package:mobile/classes/game.dart';
import 'package:mobile/constants/constants.dart' as constants;
import 'package:mobile/services/authentication.dart';
import 'package:mobile/services/communication_service.dart';

class ZenModeService extends GetxService {
  final CommunicationService communicationService =
      Get.find<CommunicationService>();
  final AuthenticationService authService = Get.find<AuthenticationService>();

  OneDifferenceImageSet? currentImageSet;
  final player = AudioPlayer();

  String selectedAudio = '';

  getRandomOneDifferenceImageSet() async {
    //var excludeQuery = exclude != null ? '?exclude=${exclude.join(',')}' : '';
    var url = Uri.parse(
        '${constants.serverPath}/api/games/random-one-difference-image-set');

    final token = await authService.getToken();
    if (token == null) return null;

    var response =
        await http.get(url, headers: {'Authorization': 'Bearer $token'});

    dynamic rawImage = jsonDecode(response.body);
    final splitLeftImage = rawImage['leftUri'].split(',');
    String pureBase64LeftImageURL =
        splitLeftImage.length > 1 ? splitLeftImage[1] : splitLeftImage[0];

    final splitRightImage = rawImage['rightUri'].split(',');
    String pureBase64RightImageURL =
        splitRightImage.length > 1 ? splitRightImage[1] : splitRightImage[0];

    var cardId = rawImage['cardId'];

    List<Vec2> difference = [];
    if (rawImage.containsKey('difference')) {
      difference = (rawImage['difference'] as List<dynamic>? ?? [])
          .map((d) => Vec2.fromJson(d))
          .toList()
          .cast<Vec2>();
    }
    return [pureBase64LeftImageURL, pureBase64RightImageURL, difference];
  }

  bool isSuccessfulClick(List<Vec2> differences, Vec2 clickPosition) {
    // Find the minimum and maximum x and y values
    double minX = differences
        .map((difference) => difference.x)
        .reduce((a, b) => a < b ? a : b);
    double maxX = differences
        .map((difference) => difference.x)
        .reduce((a, b) => a > b ? a : b);
    double minY = differences
        .map((difference) => difference.y)
        .reduce((a, b) => a < b ? a : b);
    double maxY = differences
        .map((difference) => difference.y)
        .reduce((a, b) => a > b ? a : b);

    // Check if the click position is within the range of x and y values
    bool isSuccessful = clickPosition.x >= minX &&
        clickPosition.x <= maxX &&
        clickPosition.y >= minY &&
        clickPosition.y <= maxY;

    return isSuccessful;
  }

  stopAudio() async {
    await player.stop();
  }

  selectAudio(String musicType) {
    this.selectedAudio = musicType;
  }

  startAudio() async {
    await player.play(AssetSource('audio/${this.selectedAudio}.mp3'));
  }

  // playLofi() async {
  //   await player.play(AssetSource('audio/lofi.mp3'));
  // }

  // playClassical() async {
  //   await player.play(AssetSource('audio/classical.mp3'));
  // }

  // playNature() async {
  //   await player.play(AssetSource('audio/nature.mp3'));
  // }

  // playJazz() async {
  //   await player.play(AssetSource('audio/jazz.mp3'));
  // }
}
