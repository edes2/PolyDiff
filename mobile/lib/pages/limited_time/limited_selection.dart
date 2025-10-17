import 'dart:convert';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:mobile/classes/args.dart';
import 'package:mobile/classes/enums.dart';
import 'package:mobile/classes/game.dart';
import 'package:mobile/classes/limited_game.dart';
import 'package:mobile/constants/constants.dart' as constants;
import 'package:mobile/providers/user_provider.dart';
import 'package:mobile/services/authentication.dart';
import 'package:mobile/services/chat_service.dart';
import 'package:mobile/services/communication_service.dart';
import 'package:mobile/services/socket_service.dart';
import 'package:mobile/widgets/cards/limited_joinable.dart';
import 'package:mobile/widgets/custom_scaffold.dart';
import 'package:provider/provider.dart';

class LimitedSelection extends StatefulWidget {
  const LimitedSelection({super.key});

  @override
  _LimitedSelectionState createState() => _LimitedSelectionState();
}

class _LimitedSelectionState extends State<LimitedSelection> {
  final CommunicationService commService = Get.find<CommunicationService>();
  final SocketClientService socketService = Get.find<SocketClientService>();
  final AuthenticationService authService = Get.find<AuthenticationService>();
  List<LimitedJoinable> joinableGames = [];
  final Color backgroundColor = const Color.fromARGB(255, 28, 26, 29);
  final List<String> waitingGames = [];
  late TextEditingController textEditingController;

  int inputValue = 90;
  int bonusTime = 5;
  bool switchValue = false;

  @override
  void initState() {
    super.initState();
    initializeSockets();
    _fetchData();
    textEditingController = TextEditingController(
        text: inputValue.toString()); // Initialize the TextEditingController
  }

  @override
  void dispose() {
    super.dispose();
    textEditingController.dispose();
    socketService.socket.off('updateWaitingRooms');
  }

  initializeSockets() {
    socketService.socket.on('updateWaitingRooms', (data) async {
      joinableGames = (data as List<dynamic>)
          .where((element) => element['mode'] == 'Temps limité')
          .map((jsonItem) =>
              LimitedJoinable.fromJson(jsonItem as Map<String, dynamic>))
          .toList()
          .cast<
              LimitedJoinable>(); // This cast ensures the list is of type List<LimitedJoinable>

      if (joinableGames.isEmpty) {
        joinableGames = [];
      }

      setState(() {});
    });
  }

  Player findOwnerOfGame(LimitedJoinable joinableGame) {
    Player owner = Player(uid: 'FlutterErrorUid', username: 'Mike Tyson Error');
    for (Player player in joinableGame.players) {
      if (player.uid == joinableGame.ownerId) {
        owner = player;
      }
    }
    return owner;
  }

  Future<void> _fetchData() async {
    final token = await authService.getToken();

    if (token == null) {
      return;
    }

    final responseGameRooms = await http.get(
        Uri.parse('${constants.serverPath}/api/games/gameRooms'),
        headers: {'Authorization': 'Bearer $token'});

    if (responseGameRooms.statusCode == 200) {
      // Decode the JSON response
      List<dynamic> jsonData = jsonDecode(responseGameRooms.body);

      // Convert each item in the JSON array to a LimitedJoinable object
      joinableGames = jsonData
          .where((element) => element['mode'] == 'Temps limité')
          .map((jsonItem) => LimitedJoinable.fromJson(jsonItem))
          .toList();
    } else {
      // Handle the error case
      print('Error fetching game rooms: ${responseGameRooms.statusCode}');
    }

    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return CustomScaffold(
        automaticallyImplyLeading: true,
        body: Container(
          color: const Color.fromARGB(255, 43, 41, 41),
          child: Column(children: [
            Padding(
              padding: const EdgeInsets.all(8.0),
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color.fromARGB(255, 194, 43, 181),
                ),
                onPressed: () {
                  _showModal(context);
                },
                child: const Text("Creer une nouvelle partie",
                    style: TextStyle(color: Colors.white)),
              ),
            ),
            Expanded(
              child: ListView.builder(
                itemCount: joinableGames.length,
                itemBuilder: (BuildContext context, int index) {
                  List<String> playerList = joinableGames[index]
                      .players
                      .map((player) => player.username)
                      .toList();

                  return LimitedGameCard(
                    host: findOwnerOfGame(joinableGames[index]),
                    playerList: playerList,
                  );
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(8.0),
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color.fromARGB(255, 194, 43, 181),
                ),
                onPressed: () {
                  int randomGameIndex;
                  if (joinableGames.isEmpty) {
                    return;
                  } else if (joinableGames.length == 1) {
                    randomGameIndex = 0;
                  } else {
                    randomGameIndex = Random().nextInt(joinableGames.length);
                  }
                  String ownerId =
                      findOwnerOfGame(joinableGames[randomGameIndex]).uid;
                  List<String> playerList = joinableGames[randomGameIndex]
                      .players
                      .map((player) => player.username)
                      .toList();
                  socketService.joinMultiGame(ownerId, (data) {
                    final userProvider =
                        Provider.of<UserProvider>(context, listen: false);
                    final ChatService chatService = Get.find<ChatService>();
                    chatService.createPrivateChannel(
                        'PrivateChat: ${data['roomId']}',
                        userProvider.user!.uid);
                  });
                  Navigator.pushNamed(context, '/joinerWaitingRoom',
                      arguments: JoinerWaitingRoomArgs(
                          ownerId: ownerId,
                          playerList: playerList,
                          gameMode: GameMode.limitedTime));
                },
                child: const Text("Rejoindre partie aléatoire.",
                    style: TextStyle(color: Colors.white)),
              ),
            ),
          ]),
        ));
  }

  void _showModal(BuildContext context) {
    ScrollController scrollController = ScrollController();
    FocusNode textFieldFocusNode = FocusNode();
    textFieldFocusNode.addListener(() {
      if (textFieldFocusNode.hasFocus) {
        scrollController.animateTo(
          scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (BuildContext context) {
        return StatefulBuilder(
          builder: (BuildContext context, StateSetter setModalState) {
            return SingleChildScrollView(
                controller: scrollController,
                padding: EdgeInsets.only(
                    bottom: MediaQuery.of(context).viewInsets.bottom),
                child: Container(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      TextField(
                        focusNode: textFieldFocusNode,
                        controller: textEditingController,
                        autofocus: true,
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          labelText: "Durée de jeu: ",
                          hintText: inputValue.toString(),
                        ),
                        inputFormatters: <TextInputFormatter>[
                          FilteringTextInputFormatter.digitsOnly
                        ],
                        onChanged: (value) {
                          setModalState(() {
                            inputValue = int.tryParse(value) ?? inputValue;
                            textEditingController.text = inputValue.toString();
                          });
                        },
                      ),
                      TextField(
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          labelText: "Temps bonus:",
                          hintText: bonusTime.toString(),
                        ),
                        inputFormatters: <TextInputFormatter>[
                          FilteringTextInputFormatter.digitsOnly
                        ],
                        onChanged: (value) {
                          bonusTime = int.tryParse(value) ?? 5;
                        },
                      ),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text("Autoriser le mode triche:"),
                          Switch(
                            value: switchValue,
                            onChanged: (bool value) {
                              setModalState(() {
                                switchValue = value;
                              });
                            },
                          ),
                        ],
                      ),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor:
                                  const Color.fromARGB(255, 194, 43, 181),
                            ),
                            onPressed: () {
                              Navigator.pop(context); // Close the modal
                            },
                            child: const Text('Fermer',
                                style: TextStyle(color: Colors.white)),
                          ),
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor:
                                  const Color.fromARGB(255, 194, 43, 181),
                            ),
                            onPressed: () {
                              Navigator.pop(context);
                              socketService.createLimitedGame(
                                  LimitedStartInfo(
                                      timeBonus: bonusTime,
                                      gameDuration: inputValue,
                                      allowCheat: switchValue), (data) {
                                final userProvider = Provider.of<UserProvider>(
                                    context,
                                    listen: false);
                                final ChatService chatService =
                                    Get.find<ChatService>();
                                chatService.createPrivateChannel(
                                    'PrivateChat: ${data['roomId']}',
                                    userProvider.user!.uid);
                                Navigator.pushNamed(
                                    context, '/creatorWaitingRoom',
                                    arguments: CreatorWaitingRoomArgs(
                                        ownerId: userProvider.user!.uid,
                                        gameMode: GameMode.limitedTime));
                              });
                            },
                            child: const Text('Soumettre',
                                style: TextStyle(color: Colors.white)),
                          ),
                        ],
                      )
                    ],
                  ),
                ));
          },
        );
      },
    );
  }
}
