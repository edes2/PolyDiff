import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/material.dart';
import 'package:flutter_rating_bar/flutter_rating_bar.dart';
import 'package:get/get.dart';
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

class ClassicGamePage extends StatefulWidget {
  @override
  ClassicGamePageState createState() => ClassicGamePageState();

  final String ownerId;
  const ClassicGamePage({Key? key, required this.ownerId}) : super(key: key);
}

// each image is of size 530x398 pixels on the tablet screen.
// server images are of size 640x480 pixels
class ClassicGamePageState extends State<ClassicGamePage> {
  Image errorImage = Image.asset('assets/images/erreur.png');
  bool showErrorImage = false;
  bool canClick = true;
  AudioPlayer audioPlayer = AudioPlayer();
  String cardId = '';

  img.Image imageLeft = img.Image(
      constants.gameCanvasWidth.toInt(), constants.gameCanvasHeight.toInt());
  img.Image imageRight = img.Image(
      constants.gameCanvasWidth.toInt(), constants.gameCanvasHeight.toInt());

  Rx<Uint8List> bytesLeft = Uint8List(0).obs;
  Rx<Uint8List> bytesRight = Uint8List(0).obs;

  String pureBase64diffListImageURL = '';

  double cardRating = 1;
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

    initializeGameSession(widget.ownerId);

    initializeSockets();
  }

  void initializeSockets() {
    socketService.socket.on('endGame', (data) async {
      UserProfile? currentUser = await authService.fetchUser();
      _showEndGameModal(data['winner']['uid'] == currentUser!.uid);
      ChatService chatService = Get.find<ChatService>();
      final userProvider = Provider.of<UserProvider>(context, listen: false);
      chatService.leavePrivateChannel(userProvider.user!.uid);
    });
    socketService.socket.on('differenceFoundClick', (data) {
      isCheatModeEnabled = false;
      List<Vec2> differencesPixel = [];

      audioPlayer.play(AssetSource(DifSoundSingleton().selectedDifPath));
      for (var coord in data) {
        double transformedX = (coord['x'] as num).toDouble();
        double transformedY = (coord['y'] as num).toDouble();
        differencesPixel.add(Vec2(x: transformedX, y: transformedY));
      }

      // copyDifferencesBase64(
      //     imageLeft, pureBase64RightImageURL.value, differencesPixel);
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

  copyDifferencesBase64(List<Vec2> differences) async {
    // img.Image imageLeftCopy = img.Image.from(imageLeft);
    // img.Image imageRightCopy = img.Image.from(imageRight);

    // Store original pixels and their positions
    List<List<dynamic>> originalPixelsAndPositions = [];

    print('1');
    for (var diff in differences) {
      int x = diff.x.toInt();
      int y = diff.y.toInt();
      int pixel = imageLeft.getPixel(x, y);
      originalPixelsAndPositions.add([diff, pixel]);
      // imageRight.setPixel(x, y, pixel);
    }
    print('2');
    blinkDifferences(img.Image.from(imageLeft), img.Image.from(imageRight),
        originalPixelsAndPositions, 0);
  }

  blinkDifferences(img.Image sourceImage, img.Image destinationImage,
      List<List<dynamic>> originalPixelsAndPositions, int count) async {
    // Function to execute blinking logic
    void executeBlink() {
      print('3');
      int whitePixel = img.getColor(255, 255, 255, 255); // White color

      for (var item in originalPixelsAndPositions) {
        Vec2 diff = item[0];
        int originalPixel = item[1];

        int x = diff.x.toInt();
        int y = diff.y.toInt();
        // int color = count % 2 == 0 ? originalPixel : whitePixel;
        int color = originalPixel;
        destinationImage.setPixel(x, y, color);
        sourceImage.setPixel(x, y, color);
      }
      print('4');

      bytesLeft.value = convertImgImageToUint8List(sourceImage);
      bytesRight.value = convertImgImageToUint8List(destinationImage);
    }

    void executeActualRealBlink(
        Uint8List leftImageBefore,
        Uint8List rightImageBefore,
        Uint8List leftImageAfter,
        Uint8List rightImageAfter) {
      count++;
      print('5');
      if (count % 2 == 0) {
        bytesLeft.value = leftImageAfter;
        bytesRight.value = rightImageAfter;
      } else {
        bytesLeft.value = leftImageBefore;
        bytesRight.value = rightImageBefore;
      }
    }

    print('6');
    img.Image imageBeforeLeft = img.Image.from(sourceImage);
    img.Image imageBeforeRight = img.Image.from(destinationImage);

    Uint8List leftImageBefore =
        convertImgImageToUint8List(img.Image.from(sourceImage));
    Uint8List rightImageBefore =
        convertImgImageToUint8List(img.Image.from(destinationImage));

    executeBlink();
    print('7');

    img.Image convertUint8ListToImgImage(Uint8List data) {
      return img.decodeImage(data) ??
          img.Image(1, 1); // Fallback to a single pixel image
    }

    Uint8List leftImageAfter =
        convertImgImageToUint8List(img.Image.from(sourceImage));
    Uint8List rightImageAfter =
        convertImgImageToUint8List(img.Image.from(destinationImage));

    print('8');

    // Code de debug: Ce code compare les deux images
    // Converting back to img.Image for pixel comparison
    // img.Image imgLeftBefore = convertUint8ListToImgImage(leftImageBefore);
    // img.Image imgRightBefore = convertUint8ListToImgImage(rightImageBefore);
    // img.Image imgLeftAfter = convertUint8ListToImgImage(leftImageAfter);
    // img.Image imgRightAfter = convertUint8ListToImgImage(rightImageAfter);

    // bool pixelChanged = false;
    // for (int y = 0; y < imgLeftBefore.height; y++) {
    //   for (int x = 0; x < imgLeftBefore.width; x++) {
    //     if (imgLeftBefore.getPixel(x, y) != imgLeftAfter.getPixel(x, y) ||
    //         imgRightBefore.getPixel(x, y) != imgRightAfter.getPixel(x, y)) {
    //       pixelChanged = true;
    //       break;
    //     }
    //   }
    //   if (pixelChanged) {
    //     break;
    //   }
    // }

    // print('Pixel changed: $pixelChanged');
    // Fin du code de debug: Ce code compare les deux images

    bool cheatModeHasBeenEnabled = false;
    count = 0;
    executeNextBlink() {
      if (isCheatModeEnabled) {
        cheatModeHasBeenEnabled = true;
      }
      Timer(Duration(milliseconds: 100), () {
        executeActualRealBlink(
            leftImageBefore, rightImageBefore, leftImageAfter, rightImageAfter);

        if (isCheatModeEnabled || count < 10) {
          if (isCheatModeEnabled && count == 10) {
            count = 0;
          }
          executeNextBlink();
        } else if (cheatModeHasBeenEnabled) {
          bytesLeft.value = leftImageBefore;
          bytesRight.value = rightImageBefore;
          imageLeft = img.Image.from(imageBeforeLeft);
          imageRight = img.Image.from(imageBeforeRight);
          return;
        } else if (!cheatModeHasBeenEnabled && count >= 10) {
          bytesLeft.value = leftImageAfter;
          bytesRight.value = rightImageAfter;
          imageLeft = img.Image.from(sourceImage);
          imageRight = img.Image.from(destinationImage);
          return;
        } else {
          print('ERROR: untreated case');
        }
      });
    }

    executeNextBlink();
  }

  void changePixelColor(img.Image image, int x, int y, int color) {
    if (x >= 0 && x < image.width && y >= 0 && y < image.height) {
      image.setPixel(x, y, color);
    }
  }

  @override
  void dispose() {
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
    socketService.socket.off('endGame');
    socketService.socket.off('differenceFoundClick');
    socketService.socket.off('errorClick');
    isCheatModeEnabled = false;
    gameManagerService.cheatArray = [];
    super.dispose();
  }

  initializeGameSession(String ownerId) async {
    var user = await authService.fetchUser();
    if (user == null) {
      return;
    }
    final token = await authService.getToken();
    if (token == null) return;

    setState(() => isLoading = true);

    try {
      final playingInfo =
          await gameManagerService.initializeGameSession(ownerId, user);
      cardId = playingInfo!.cardInfo.id;
      var listImageUrl = await gameManagerService.getImageById(cardId);

      var diffListImageUrl = await gameManagerService.getDiffImageById(cardId);
      setState(() {
        img.Image? left = img.decodeImage(base64Decode(listImageUrl[0]));
        img.Image? right = img.decodeImage(base64Decode(listImageUrl[1]));
        if (left != null) imageLeft = left;
        if (right != null) imageRight = right;
        bytesLeft.value = convertImgImageToUint8List(imageLeft);
        bytesRight.value = convertImgImageToUint8List(imageRight);
        pureBase64diffListImageURL = diffListImageUrl;
        isLoading = false;
      });
    } catch (e) {
      setState(() => isLoading = false);
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

  void toggleCheatMode() {
    setState(() {
      if (!isCheatModeEnabled) {
        copyDifferencesBase64(gameManagerService.cheatArray);
      } else {
        // window.clearInterval(this.intervalId);
        // this.replayService.addReplayEvent(ClientEvent.StopCheat);
      }
      isCheatModeEnabled = !isCheatModeEnabled;
    });
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
            isWinner ? 'Félicitation, vous avez gagné!' : 'Vous avez perdu!',
            style: const TextStyle(
                color: Colors.white, fontWeight: FontWeight.bold),
          ),
          content: SingleChildScrollView(
            // To ensure the modal is scrollable if the content is too long
            child: ListBody(
              children: <Widget>[
                const Text(
                  'Aimeriez vous noter la partie?',
                  style: TextStyle(color: Colors.white),
                ),
                // Your RatingBar.builder here
                RatingBar.builder(
                  initialRating: cardRating,
                  minRating: 1,
                  direction: Axis.horizontal,
                  allowHalfRating: false,
                  itemCount: 5,
                  itemPadding: const EdgeInsets.symmetric(horizontal: 4.0),
                  itemBuilder: (context, _) => const Icon(
                    Icons.star,
                    color: Colors.amber,
                  ),
                  onRatingUpdate: (rating) {
                    setState(() {
                      cardRating = rating;
                    });
                  },
                ),
              ],
            ),
          ),
          actions: <Widget>[
            ElevatedButton(
              onPressed: () async {
                Navigator.popUntil(context, ModalRoute.withName('/home'));
                await commService.putRating(cardId, cardRating);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.purple,
              ),
              child: const Text(
                'Soumettre et quitter',
                style: TextStyle(color: Colors.white),
              ),
            ),
            if (isWinner)
              ElevatedButton(
                onPressed: () {
                  Share.share(
                      'Je viens de battre la partie ${gameManagerService.playingInfo.value.cardInfo.name} sur Erratum !',
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
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Obx(() => Text(
                                            'Game: ${gameManagerService.playingInfo.value.cardInfo.name}',
                                            style: const TextStyle(
                                                fontSize: 24,
                                                fontWeight: FontWeight.bold,
                                                color: Color.fromARGB(
                                                    255, 53, 249, 155)),
                                          )),
                                      const SizedBox(height: 5),
                                      Obx(() => Text(
                                            'Mode: ${gameManagerService.playingInfo.value.mode}',
                                            style: const TextStyle(
                                                fontSize: 20,
                                                color: Colors.white),
                                          )),
                                      const SizedBox(height: 5),
                                      Obx(() => Text(
                                            'Difficulté: ${gameManagerService.playingInfo.value.cardInfo.difficulty}',
                                            style: const TextStyle(
                                                fontSize: 18,
                                                color: Colors.white),
                                          )),
                                      const SizedBox(height: 5),
                                      Obx(() => Text(
                                            'Nombre de différences: ${gameManagerService.playingInfo.value.cardInfo.diffCount}',
                                            style: const TextStyle(
                                                fontSize: 18,
                                                color: Colors.white),
                                          )),
                                    ],
                                  ),
                                  Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.center,
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
                                                    '${player.diffCount.value}  differences trouvées',
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
                                        child: const Text(
                                            'Abandonner la partie',
                                            style: TextStyle(
                                                fontSize: 16,
                                                color: Colors.white)),
                                      ),
                                      const SizedBox(height: 10),
                                      if (gameManagerService
                                          .cheatArray.isNotEmpty)
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
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 16.0),
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
                                Obx(() => buildClickableImage(bytesRight.value,
                                    rightImageClicks, 'right'))
                              ],
                            ),
                          ],
                        ),
                      ))));
  }

  Uint8List convertImgImageToUint8List(img.Image image) {
    // Encode the image to a byte format (e.g., PNG)
    List<int> encodedImage = img.encodePng(image);
    // Convert the List<int> to Uint8List
    return Uint8List.fromList(encodedImage);
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
