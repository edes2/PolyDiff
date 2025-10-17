import 'dart:convert';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:mobile/classes/args.dart';
import 'package:mobile/classes/enums.dart';
import 'package:mobile/classes/game.dart';
import 'package:mobile/constants/constants.dart' as constants;
import 'package:mobile/providers/user_provider.dart';
import 'package:mobile/services/authentication.dart';
import 'package:mobile/services/chat_service.dart';
import 'package:mobile/services/communication_service.dart';
import 'package:mobile/services/socket_service.dart';
import 'package:mobile/widgets/cards/joinable_game.dart';
import 'package:mobile/widgets/custom_scaffold.dart';
import 'package:provider/provider.dart';

class GameWithOwner {
  final Game game;
  final Player owner;

  GameWithOwner({required this.game, required this.owner});
}

class ClassicSelection extends StatefulWidget {
  const ClassicSelection({super.key});

  @override
  _ClassicSelectionState createState() => _ClassicSelectionState();
}

class _ClassicSelectionState extends State<ClassicSelection> {
  final CommunicationService commService = Get.find<CommunicationService>();
  final SocketClientService socketService = Get.find<SocketClientService>();
  final AuthenticationService authService = Get.find<AuthenticationService>();
  List<GameWithOwner> games = [];
  List<JoinableGame> joinableGames = [];
  final Color backgroundColor = const Color.fromARGB(255, 28, 26, 29);

  @override
  void initState() {
    super.initState();
    initializeSockets();
    _fetchData();
  }

  @override
  void dispose() {
    super.dispose();
    socketService.socket.off('updateWaitingRooms');
  }

  initializeSockets() {
    socketService.socket.on('updateWaitingRooms', (data) async {
      joinableGames = (data as List<dynamic>)
          .where((element) => element['mode'] == 'Classique')
          .map((jsonItem) =>
              JoinableGame.fromJson(jsonItem as Map<String, dynamic>))
          .toList()
          .cast<
              JoinableGame>(); // This cast ensures the list is of type List<JoinableGame>

      if (joinableGames.isEmpty) {
        games = [];
        joinableGames = [];
      } else {
        await handleUpdateSelection(
            joinableGames, await authService.getToken());
      }

      setState(() {});
    });
  }

  Player findOwnerOfGame(JoinableGame joinableGame) {
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

      // Convert each item in the JSON array to a JoinableGame object
      joinableGames = jsonData
          .where((element) => element['mode'] == 'Classique')
          .map((jsonItem) => JoinableGame.fromJson(jsonItem))
          .toList();

      // Do something with joinableGames, like updating the state
      await handleUpdateSelection(joinableGames, token);
    } else {
      // Handle the error case
      print('Error fetching game rooms: ${responseGameRooms.statusCode}');
    }

    setState(() {});
  }

  handleUpdateSelection(List<JoinableGame> joinableGames, dynamic token) async {
    games = [];
    List<GameWithOwner> updatedGames = [];
    for (JoinableGame joinableGame in joinableGames) {
      final responseGameCard = await http.get(
          Uri.parse('${constants.serverPath}/api/cards/${joinableGame.cardId}'),
          headers: {'Authorization': 'Bearer $token'});
      var rawGameInfo = jsonDecode(responseGameCard.body);

      updatedGames.add(GameWithOwner(
          game: Game(
              cardId: rawGameInfo['id'],
              imageUrl: await commService.getMiniatureById(rawGameInfo['id']),
              name: rawGameInfo['name'],
              diffCount: rawGameInfo['diffCount'],
              difficulty: rawGameInfo['difficulty'] == 'Facile'
                  ? Difficulty.facile
                  : Difficulty.difficile,
              rating: double.tryParse(rawGameInfo['rating'].toString()),
              numberOfRatings:
                  int.tryParse(rawGameInfo['numberOfRatings'].toString())),
          owner: findOwnerOfGame(joinableGame)));
    }
    setState(() {
      games = updatedGames;
    });
  }

  @override
  Widget build(BuildContext context) {
    return CustomScaffold(
      automaticallyImplyLeading: true,
      body: Container(
        color: const Color.fromARGB(255, 28, 26, 29),
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(8.0),
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color.fromARGB(255, 194, 43, 181),
                ),
                onPressed: () {
                  Navigator.pushNamed(context, '/classicCreate');
                },
                child: const Text("Creer une partie",
                    style: TextStyle(color: Colors.white)),
              ),
            ),
            // The sort button
            Padding(
              padding:
                  const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color.fromARGB(255, 194, 43, 181),
                ),
                onPressed: () {
                  setState(() {
                    sortGames(); // This is the function that sorts your games
                  });
                },
                child: const Text('Trier les jeux en fonction de leurs notes',
                    style: TextStyle(color: Colors.white)),
              ),
            ),
            Expanded(
              child: ListView.builder(
                itemCount: games.length,
                itemBuilder: (BuildContext context, int index) {
                  GameWithOwner game = games[index]; // Implement this function
                  List<String> playerList = joinableGames[index]
                      .players
                      .map((player) => player.username)
                      .toList();
                  // Implement this function

                  return JoinableGameCard(
                    game: game.game,
                    host: game.owner,
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
                  if (games.isEmpty) {
                    return;
                  } else if (games.length == 1) {
                    randomGameIndex = 0;
                  } else {
                    randomGameIndex = Random().nextInt(games.length);
                  }
                  List<String> playerList = joinableGames[randomGameIndex]
                      .players
                      .map((player) => player.username)
                      .toList();
                  socketService.joinMultiGame(games[randomGameIndex].owner.uid,
                      (data) {
                    final userProvider =
                        Provider.of<UserProvider>(context, listen: false);
                    final ChatService chatService = Get.find<ChatService>();
                    chatService.createPrivateChannel(
                        'PrivateChat: ${data['roomId']}',
                        userProvider.user!.uid);
                  });
                  Navigator.pushNamed(context, '/joinerWaitingRoom',
                      arguments: JoinerWaitingRoomArgs(
                          ownerId: games[randomGameIndex].owner.uid,
                          playerList: playerList,
                          gameMode: GameMode.classic));
                },
                child: const Text("Rejoindre partie aléatoire.",
                    style: TextStyle(color: Colors.white)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void sortGames() {
    if (games.isEmpty) return;
    games.sort((a, b) {
      // Handle the case where both ratings are null
      if (a.game.rating == null && b.game.rating == null) {
        return 0; // Consider them equal in terms of sorting
      }

      // Handle the case where only one rating is null
      if (a.game.rating == null) return 1; // a should be ordered after b
      if (b.game.rating == null) return -1; // b should be ordered after a

      // If both ratings are non-null, compare them directly
      return b.game.rating!.compareTo(a.game.rating!);
    });
  }
}
