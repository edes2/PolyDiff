import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:mobile/classes/game.dart';
import 'package:mobile/constants/constants.dart' as constants;
import 'package:mobile/services/authentication.dart';
import 'package:mobile/services/communication_service.dart';
import 'package:mobile/services/game_manager_service.dart';
import 'package:mobile/services/socket_service.dart';
import 'package:mobile/services/zen_mode.dart';
import 'package:mobile/widgets/custom_scaffold.dart';

class ZenGamePage extends StatefulWidget {
  @override
  ZenGamePageState createState() => ZenGamePageState();
}

class ZenGamePageState extends State<ZenGamePage> {
  final CommunicationService commService = Get.find<CommunicationService>();
  final GameManagerService gameManagerService = Get.find<GameManagerService>();
  final SocketClientService socketService = Get.find<SocketClientService>();
  final AuthenticationService authService = Get.find<AuthenticationService>();
  final ZenModeService zenModeService = Get.find<ZenModeService>();
  RxString pureBase64LeftImageURL = ''.obs;
  RxString pureBase64RightImageURL = ''.obs;
  List<Offset> leftImageClicks = [];
  List<Offset> rightImageClicks = [];
  double scaleX = 530 / 640;
  double scaleY = 398 / 480;
  List<Vec2> differences = [];
  bool isLoading = true;

  // coordinates of the click on the image after adjusting for the screen size
  Offset leftImageClickAdjusted = const Offset(0, 0);
  Offset rightImageClickAdjusted = const Offset(0, 0);

  // coordinates of the click on the image on the tablet
  Offset leftImageClick = const Offset(0, 0);
  Offset rightImageClick = const Offset(0, 0);

  @override
  void initState() {
    super.initState();
    zenModeService.startAudio();
    initializeGameSession();
  }

  initializeGameSession() async {
    var listImageUrl = await zenModeService.getRandomOneDifferenceImageSet();
    pureBase64LeftImageURL.value = listImageUrl[0];
    pureBase64RightImageURL.value = listImageUrl[1];
    setState(() {
      differences = listImageUrl[2];
      isLoading = false;
    });
  }

  void adjustTouchScreen(TapUpDetails details, String side) {
    final Vec2 mousePosition =
        Vec2(x: details.localPosition.dx, y: details.localPosition.dy);

    // Stretching click coordinate for 640x480 image to send to server.
    final Vec2 stretchedMousePosition = Vec2(
        x: (details.localPosition.dx / 560) * 640,
        y: (details.localPosition.dy / 420) * 480);

    setState(() {
      if (side == 'left') {
        Offset clickPosition = Offset(mousePosition.x, mousePosition.y);
        leftImageClicks.add(clickPosition);
        leftImageClick = clickPosition;
        leftImageClickAdjusted = clickPosition;
      } else {
        Offset clickPosition = Offset(mousePosition.x, mousePosition.y);
        rightImageClicks.add(clickPosition);
        rightImageClick = clickPosition;
        rightImageClickAdjusted = clickPosition;
      }
      if (zenModeService.isSuccessfulClick(differences,
          Vec2(x: stretchedMousePosition.x, y: stretchedMousePosition.y))) {
        initializeGameSession();
      }
    });
  }

  @override
  void dispose() {
    // Perform any cleanup tasks here
    zenModeService.stopAudio();

    super.dispose(); // Always call super.dispose() at the end
  }

  @override
  Widget build(BuildContext context) {
    return CustomScaffold(
      automaticallyImplyLeading: true,
      backgroundColor: const Color.fromARGB(255, 43, 41, 41),
      body: isLoading
          ? const Center(
              child: CircularProgressIndicator()) // Show loading indicator
          : Center(
              // Main content
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  Obx(() => buildClickableImage(
                      pureBase64LeftImageURL.value, leftImageClicks, 'left')),
                  Obx(() => buildClickableImage(pureBase64RightImageURL.value,
                      rightImageClicks, 'right')),
                ],
              ),
            ),
    );
  }

  Widget buildClickableImage(
      String base64ImageUrl, List<Offset> clickPoints, String side) {
    return Container(
        margin: const EdgeInsets.all(4.0), // External margin
        decoration: BoxDecoration(
          color: Colors.transparent, // Make background transparent
          border: Border.all(
            color: Colors.purple, // Color of the border
            width: 4, // Width of the border // 3
          ),
          borderRadius: BorderRadius.circular(5), // Round the corners
        ),
        child: GestureDetector(
          onTapUp: (TapUpDetails details) => adjustTouchScreen(details, side),
          child: SizedBox(
            width: constants.gameCanvasWidth,
            height: constants.gameCanvasHeight,
            child: Stack(
              children: [
                Image.memory(
                  base64Decode(base64ImageUrl),
                  fit: BoxFit.contain,
                ),
              ],
            ),
          ),
        ));
  }
}
