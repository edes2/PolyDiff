import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:image/image.dart' as img;
import 'package:mobile/classes/game.dart';
import 'package:mobile/classes/user.dart';
import 'package:mobile/constants/constants.dart' as constants;
import 'package:mobile/providers/user_provider.dart';
import 'package:mobile/services/authentication.dart';
import 'package:mobile/services/chat_service.dart';
import 'package:mobile/services/communication_service.dart';
import 'package:mobile/services/game_manager_service.dart';
import 'package:mobile/services/socket_service.dart';
import 'package:mobile/widgets/custom_scaffold.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';

class LimitedGamePage extends StatefulWidget {
  @override
  LimitedGamePageState createState() => LimitedGamePageState();

  final String ownerId;
  const LimitedGamePage({Key? key, required this.ownerId}) : super(key: key);
}

// each image is of size 530x398 pixels on the tablet screen.
// server images are of size 640x480 pixels
class LimitedGamePageState extends State<LimitedGamePage> {
  Image errorImage = Image.asset('assets/images/erreur.png');
  bool showErrorImage = false;
  bool canClick = true;
  AudioPlayer audioPlayer = AudioPlayer();
  String cardId = '';

  img.Image imageLeft = img.Image(
      constants.gameCanvasWidth.toInt(), constants.gameCanvasHeight.toInt());
  img.Image imageRight = img.Image(
      constants.gameCanvasWidth.toInt(), constants.gameCanvasHeight.toInt());

  img.Image imageNextLeft = img.Image(
      constants.gameCanvasWidth.toInt(), constants.gameCanvasHeight.toInt());
  img.Image imageNextRight = img.Image(
      constants.gameCanvasWidth.toInt(), constants.gameCanvasHeight.toInt());

  Rx<Uint8List> bytesLeft = Uint8List(0).obs;
  Rx<Uint8List> bytesRight = Uint8List(0).obs;

  String pureBase64diffListImageURL = '';
  // RxString pureBase64LeftImageURL = ''.obs;
  // RxString pureBase64RightImageURL = ''.obs;

  // hardcoded for now, but should be dynamic later
  String gameMode = 'classique';
  String playMode = 'multi';

  // temporary variables for now, because we want to see where we are clicking on the image to draw a point
  List<Offset> leftImageClicks = [];
  List<Offset> rightImageClicks = [];

  // coordinates of the click on the image after adjusting for the screen size
  Offset leftImageClickAdjusted = const Offset(0, 0);
  Offset rightImageClickAdjusted = const Offset(0, 0);

  // coordinates of the click on the image on the tablet
  Offset leftImageClick = const Offset(0, 0);
  Offset rightImageClick = const Offset(0, 0);

  bool firstSetReceived = false;

  final CommunicationService commService = Get.find<CommunicationService>();
  final GameManagerService gameManagerService = Get.find<GameManagerService>();
  final SocketClientService socketService = Get.find<SocketClientService>();
  final AuthenticationService authService = Get.find<AuthenticationService>();

  bool isCheatModeEnabled = false; // Variable to track toggle state
  bool isLoading = true;

  String errorSound = 'audio/errorSound1.wav';
  String differenceFoundSound = 'audio/differenceFoundSound1.wav';

  @override
  void initState() {
    super.initState();
    // gameManagerService.cheatArray = [
    //   Vec2(x: 1, y: 1)
    // ]; // fix bizarre pour voir le widget.

    initializeSockets();

    initializeGameSession(widget.ownerId);
  }

  Uint8List convertImgImageToUint8List(img.Image image) {
    // Encode the image to a byte format (e.g., PNG)
    List<int> encodedImage = img.encodePng(image);
    // Convert the List<int> to Uint8List
    return Uint8List.fromList(encodedImage);
  }

  void initializeSockets() {
    socketService.socket.off('endGame');
    socketService.socket.off('differenceFoundClick');
    socketService.socket.off('errorClick');
    socketService.socket.off('moveNextSet');
    socketService.socket.on('moveNextSet', (data) {
      img.Image? left =
          img.decodeImage(base64Decode(data['leftUri'].split(',')[1]));
      img.Image? right =
          img.decodeImage(base64Decode(data['rightUri'].split(',')[1]));
      if (left != null) imageNextLeft = left;
      if (right != null) imageNextRight = right;

      if (!firstSetReceived) {
        if (left != null) imageLeft = left;
        if (right != null) imageRight = right;
        bytesLeft.value = convertImgImageToUint8List(imageNextLeft);
        bytesRight.value = convertImgImageToUint8List(imageNextRight);
        setState(() {
          isLoading = false;
        });
      }

      gameManagerService.communicationService
          .getCheat(widget.ownerId)
          .then((cheats) {
        gameManagerService.cheatArray = cheats;
      });
      // TODO: DEMANDER LES CHEATS.

      firstSetReceived = true;
      // bytesLeft.value = convertImgImageToUint8List(imageLeft);
      // bytesRight.value = convertImgImageToUint8List(imageRight);
      // pureBase64LeftImageURL.value = data['leftUri'].split(',')[1];
      // pureBase64RightImageURL.value = data['rightUri'].split(',')[1];
      ;
    });

    socketService.socket.on('endGame', (data) async {
      ChatService chatService = Get.find<ChatService>();
      final userProvider = Provider.of<UserProvider>(context, listen: false);
      chatService.leavePrivateChannel(userProvider.user!.uid);
      _showEndGameModal(!data['isTimeout']);
    });
    socketService.socket.on('differenceFoundClick', (data) {
      List<Vec2> differencesPixel = [];
      audioPlayer.play(AssetSource(DifSoundSingleton().selectedDifPath));

      for (var coord in data) {
        double transformedX = coord['x'].toDouble();
        double transformedY = coord['y'].toDouble();
        differencesPixel.add(Vec2(x: transformedX, y: transformedY));
      }

      copyDifferencesBase64(differencesPixel);
    });
    socketService.socket.on('errorClick', (data) {
      setState(() {
        showErrorImage = true;
        canClick = false;
      });
      audioPlayer.play(AssetSource(ErrorSoundSingleton().selectedErrorPath));

      Timer(const Duration(seconds: 2), () {
        setState(() {
          canClick = true;
          showErrorImage = false;
        });
      });
    });
  }

  void executeActualRealBlink(
      Uint8List leftImageBefore,
      Uint8List rightImageBefore,
      Uint8List leftImageAfter,
      Uint8List rightImageAfter,
      int count) {
    if (count % 2 == 0) {
      bytesLeft.value = leftImageAfter;
      bytesRight.value = rightImageAfter;
    } else {
      bytesLeft.value = leftImageBefore;
      bytesRight.value = rightImageBefore;
    }
  }

  copyDifferencesBase64(List<Vec2> differences) async {
    // Convertir les chaînes Base64 en images
    // var sourceBytes = base64Decode(sourceImageBase64);
    // var destinationBytes = base64Decode(destinationImageBase64);
    // var sourceImage = img.decodeImage(sourceBytes)!;
    // var destinationImage = img.decodeImage(destinationBytes)!;
    List<List<dynamic>> originalPixelsAndPositions = [];

    img.Image imageBeforeLeft = img.Image.from(imageLeft);
    img.Image imageBeforeRight = img.Image.from(imageRight);

    // Copier les pixels
    for (var diff in differences) {
      int x = diff.x.toInt();
      int y = diff.y.toInt();
      int pixel = imageLeft.getPixel(x, y);
      imageRight.setPixel(x, y, pixel);
      // originalPixelsAndPositions.add([diff, pixel]);
      // if (x >= 0 && x < sourceImage.width && y >= 0 && y < sourceImage.height) {
      //   int pixel = sourceImage.getPixel(x, y);
      //   destinationImage.setPixel(x, y, pixel);
      // }
    }
    Uint8List ULeftBefore = convertImgImageToUint8List(imageBeforeLeft);
    Uint8List URightBefore = convertImgImageToUint8List(imageBeforeRight);
    Uint8List ULeftAfter = convertImgImageToUint8List(imageLeft);
    Uint8List URightAfter = convertImgImageToUint8List(imageRight);

    int count = 0;
    executeNextBlink() async {
      Timer(Duration(milliseconds: 100), () {
        executeActualRealBlink(
            ULeftBefore, URightBefore, ULeftAfter, URightAfter, count);
        count++;
        if (count < 10) {
          executeNextBlink();
        } else {
          imageLeft = imageNextLeft;
          imageRight = imageNextRight;
          bytesLeft.value = convertImgImageToUint8List(imageNextLeft);
          bytesRight.value = convertImgImageToUint8List(imageNextRight);
        }
      });
    }

    executeNextBlink();

    // bytesLeft.value = convertImgImageToUint8List(imageLeft);
    // bytesLeft.value = convertImgImageToUint8List(imageRight);
    // TODO : MODIFIER AUSIS LE IMAGE ?
  }

  cheatModecopyDifferencesBase64(List<Vec2> differences) async {
    List<List<dynamic>> originalPixelsAndPositions = [];

    img.Image imageBeforeLeft = img.Image.from(imageLeft);
    img.Image imageBeforeRight = img.Image.from(imageRight);

    // Copier les pixels
    for (var diff in differences) {
      int x = diff.x.toInt();
      int y = diff.y.toInt();
      int pixel = imageLeft.getPixel(x, y);
      imageRight.setPixel(x, y, pixel);
    }
    Uint8List ULeftBefore = convertImgImageToUint8List(imageBeforeLeft);
    Uint8List URightBefore = convertImgImageToUint8List(imageBeforeRight);
    Uint8List ULeftAfter = convertImgImageToUint8List(imageLeft);
    Uint8List URightAfter = convertImgImageToUint8List(imageRight);

    int count = 0;
    executeNextBlink() async {
      Timer(Duration(milliseconds: 100), () {
        executeActualRealBlink(
            ULeftBefore, URightBefore, ULeftAfter, URightAfter, count);
        if (count == 10) {
          count = 0;
        }
        count++;
        if (!isCheatModeEnabled) {
          imageLeft = imageBeforeLeft;
          imageRight = imageBeforeRight;
          bytesLeft.value = ULeftBefore;
          bytesRight.value = URightBefore;
          return;
        } else {
          executeNextBlink();
        }
      });
    }

    executeNextBlink();
  }

  void toggleCheatMode() {
    setState(() {
      if (!isCheatModeEnabled) {
        cheatModecopyDifferencesBase64(gameManagerService.cheatArray);
        // this.intervalId = await this.flashManager.flashPixelsByFrequency(this.cheatDiffs);
        // replay service add replay event
      } else {
        // window.clearInterval(this.intervalId);
        // this.replayService.addReplayEvent(ClientEvent.StopCheat);
      }
      isCheatModeEnabled = !isCheatModeEnabled;

      // Implement what happens when cheat mode is toggled
    });
  }

  @override
  void dispose() {
    isCheatModeEnabled = false;
    gameManagerService.cheatArray = [];
    socketService.socket.off('endGame');
    socketService.socket.off('differenceFoundClick');
    socketService.socket.off('errorClick');
    socketService.socket.off('moveNextSet');

    gameManagerService.cheatArray = [];

    gameManagerService.playingInfo = PlayingInfo(
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
    super.dispose();
  }

  initializeGameSession(String ownerId) async {
    var user = await authService.fetchUser();
    if (user == null) {
      return;
    }
    final token = await authService.getToken();
    if (token == null) return;

    try {
      final response = await http.get(
          Uri.parse('${constants.serverPath}/api/games/playing-info/$ownerId'),
          headers: {'Authorization': 'Bearer $token'});
      var responseBody = jsonDecode(response.body);

      for (var player in responseBody['players']) {
        gameManagerService.playingInfo.value.players.add(PlayerInGame(
            user: UserProfile(
                uid: player['user']['uid'],
                email: player['user']['email'],
                username: player['user']['username']),
            diffCount: player['diffCount']));
      }
    } catch (e) {
      print(e);
    }
  }

  void adjustTouchScreen(TapUpDetails details, String side) {
    isCheatModeEnabled = false;
    if (!canClick) {
      return;
    }

    final Vec2 mousePosition =
        Vec2(x: details.localPosition.dx, y: details.localPosition.dy);

    // Stretching click coordinate for 640x480 image to send to server.
    final Vec2 stretchedMousePosition = Vec2(
        x: (details.localPosition.dx / 560) * 640,
        y: (details.localPosition.dy / 420) * 480);

    setState(() {
      if (side == 'left') {
        // TODO: FIX VISUAL RED DOT AND ERROR MESSAGE POSITION
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
    });
    final ClickValidation clickValidation =
        ClickValidation(side: side, position: stretchedMousePosition);
    socketService.clickHitDetect(clickValidation);
  }

  void _showEndGameModal(bool isWinner) {
    isCheatModeEnabled = false;
    showDialog(
      context: context,
      barrierDismissible: false, // Prevent closing the modal by tapping outside
      builder: (BuildContext context) {
        return AlertDialog(
          backgroundColor: const Color.fromARGB(255, 43, 41, 41),
          title: Text(
            isWinner ? 'Partie complétée' : 'Partie complétée',
            style: const TextStyle(
                color: Colors.white, fontWeight: FontWeight.bold),
          ),
          actions: <Widget>[
            ElevatedButton(
              onPressed: () {
                Navigator.popUntil(context, ModalRoute.withName('/home'));
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.purple,
              ),
              child: const Text(
                'Quitter',
                style: TextStyle(color: Colors.white),
              ),
            ),
            if (isWinner)
              ElevatedButton(
                onPressed: () {
                  Share.share(
                      'Je viens de battre le mode temps limité sur Erratum!" pour une partie temps limité',
                      subject: 'Erratum Victory!');
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green,
                ),
                child: const Text(
                  'Partager',
                  style: TextStyle(color: Colors.white),
                ),
              ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return CustomScaffold(
      automaticallyImplyLeading: false,
      body: SafeArea(
        child: Container(
          height: MediaQuery.of(context).size.height,
          color: const Color.fromARGB(255, 43, 41, 41),
          child: isLoading
              ? const Center(child: CircularProgressIndicator())
              : SingleChildScrollView(
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              // First Column content
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Mode: Temps limité',
                                    style: const TextStyle(
                                        fontSize: 24,
                                        fontWeight: FontWeight.bold,
                                        color:
                                            Color.fromARGB(255, 53, 249, 155)),
                                  ),
                                ],
                              ),
                              // Second Column content
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.center,
                                children: [
                                  Obx(() => Column(
                                        children: gameManagerService
                                            .playingInfo.value.players
                                            .map((player) {
                                          return Row(
                                            mainAxisAlignment:
                                                MainAxisAlignment.center,
                                            children: [
                                              Text(
                                                '${player.user.username}:  ',
                                                style: const TextStyle(
                                                    fontSize: 18,
                                                    color: Colors.purple),
                                              ),
                                              Text(
                                                '${player.diffCount.value}  differences trouvée',
                                                style: const TextStyle(
                                                    fontSize: 18,
                                                    color: Colors.white),
                                              ),
                                              const SizedBox(height: 5),
                                            ],
                                          );
                                        }).toList(),
                                      )),
                                ],
                              ),
                              // Third Column content
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  ElevatedButton(
                                    onPressed: () {
                                      socketService.abandonGame();
                                      ChatService chatService =
                                          Get.find<ChatService>();
                                      final userProvider =
                                          Provider.of<UserProvider>(context,
                                              listen: false);
                                      chatService.leavePrivateChannel(
                                          userProvider.user!.uid);
                                      Navigator.popUntil(context,
                                          ModalRoute.withName('/home'));
                                    },
                                    style: ElevatedButton.styleFrom(
                                        backgroundColor: Colors.purple),
                                    child: const Text('Abandonner la partie',
                                        style: TextStyle(
                                            fontSize: 16, color: Colors.white)),
                                  ),
                                  const SizedBox(height: 10),
                                  if (gameManagerService.cheatArray.isNotEmpty)
                                    ElevatedButton(
                                      onPressed: toggleCheatMode,
                                      style: ElevatedButton.styleFrom(
                                          backgroundColor: Colors.purple),
                                      child: Text(
                                          isCheatModeEnabled
                                              ? 'Désactiver le mode triche'
                                              : 'Activer le mode triche',
                                          style: const TextStyle(
                                              fontSize: 16,
                                              color: Colors.white)),
                                    ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16.0),
                          child: Center(
                            child: Obx(() => Text(
                                  'Time: ${gameManagerService.timerString.value}',
                                  style: const TextStyle(
                                      fontSize: 20, color: Colors.white),
                                )),
                          ),
                        ),
                        const SizedBox(height: 20),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                          children: [
                            Obx(() => buildClickableImage(
                                bytesLeft.value, leftImageClicks, 'left')),
                            Obx(() => buildClickableImage(
                                bytesRight.value, rightImageClicks, 'right')),
                          ],
                        ),
                      ]),
                ),
        ),
      ),
    );
  }

  Widget buildClickableImage(
      Uint8List imageBytes, List<Offset> clickPoints, String side) {
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
          child: Container(
            width: constants.gameCanvasWidth,
            height: constants.gameCanvasHeight,
            child: Stack(
              children: [
                Image.memory(
                  imageBytes,
                  fit: BoxFit.contain,
                  key: UniqueKey(),
                ),
                CustomPaint(
                  painter: ClickPointsPainter(
                    side == 'left' ? clickPoints : [],
                    side == 'right' ? clickPoints : [],
                    showErrorImage,
                  ),
                ),
                if (showErrorImage)
                  Positioned(
                    left: side == 'left'
                        ? (leftImageClick.dx - 105)
                        : (rightImageClick.dx - 105),
                    top: side == 'left'
                        ? (leftImageClick.dy - 24)
                        : (rightImageClick.dy - 24),
                    child: Transform.scale(
                      scale: 0.7,
                      child: errorImage,
                    ),
                  ),
              ],
            ),
          ),
        ));
  }
}

class ClickPointsPainter extends CustomPainter {
  final List<Offset> leftClickPoints;
  final List<Offset> rightClickPoints;
  final double scale;
  final bool showErrorImage;

  ClickPointsPainter(
      this.leftClickPoints, this.rightClickPoints, this.showErrorImage,
      {this.scale = 1.0});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.red // Set the color of the dot
      ..style = PaintingStyle.fill;

    if (showErrorImage) {
      if (leftClickPoints.isNotEmpty) {
        final lastPoint = leftClickPoints.last;
        final scaledPoint = Offset(lastPoint.dx, lastPoint.dy);
        canvas.drawCircle(scaledPoint, 5, paint);
      }

      if (rightClickPoints.isNotEmpty) {
        final lastPoint = rightClickPoints.last;
        final scaledPoint = Offset(lastPoint.dx, lastPoint.dy);
        canvas.drawCircle(scaledPoint, 5, paint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) {
    return true;
  }
}
