import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:mobile/classes/enums.dart';
import 'package:mobile/providers/user_provider.dart';
import 'package:mobile/services/chat_service.dart';
import 'package:mobile/services/socket_service.dart';
import 'package:mobile/widgets/custom_scaffold.dart';
import 'package:provider/provider.dart';

class CreatorWaitingRoom extends StatefulWidget {
  final String ownerId; // Add ownerId field
  final GameMode gameMode;
  // Update the constructor to accept ownerId
  CreatorWaitingRoom({Key? key, required this.ownerId, required this.gameMode})
      : super(key: key);

  @override
  _CreatorWaitingRoomState createState() => _CreatorWaitingRoomState();
}

class _CreatorWaitingRoomState extends State<CreatorWaitingRoom> {
  final SocketClientService socketService = Get.find<SocketClientService>();
  List<String> players = [];

  @override
  void initState() {
    super.initState();
    players = [];
    initializeSockets();
  }

  @override
  void dispose() {
    super.dispose();
    socketService.socket.off('updateRoomPlayers${widget.ownerId}');
    socketService.socket.off('gameStarted');
  }

  void initializeSockets() {
    socketService.socket.on('updateRoomPlayers${widget.ownerId}', (data) {
      setState(() {
        players = [];
        for (var player in data) {
          if (player['uid'] != widget.ownerId) {
            players.add(
                player['username'] ?? ''); // Add username if uid is not ownerId
          }
        }
      });
    });

    socketService.socket.on('gameStarted', (_) {
      if (widget.gameMode == GameMode.classic) {
        Navigator.pushNamed(context, '/gameClassicPage',
            arguments: widget.ownerId);
      } else if (widget.gameMode == GameMode.limitedTime) {
        Navigator.pushNamed(context, '/gameLimitedPage',
            arguments: widget.ownerId);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return CustomScaffold(
        automaticallyImplyLeading: false,
        body: Container(
          color: const Color.fromARGB(255, 28, 26, 29),
          child: Column(children: [
            const Padding(
              padding: EdgeInsets.all(8.0),
              child: Text(
                'Joueurs en attente',
                style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.white),
              ),
            ),
            // Expanded ListView for the list of players
            Expanded(
              child: ListView.builder(
                itemCount: players.length,
                itemBuilder: (context, index) {
                  return ListTile(
                    title: Text(players[index], style: TextStyle(
          color: Colors.white, ),),
                  );
                },
              ),
            ),
            // Row for the buttons
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                ElevatedButton(
                  onPressed: stopCreation,
                  style: ElevatedButton.styleFrom(
                      backgroundColor: const Color.fromARGB(255, 194, 43, 181)),
                  child: const Text(
                    'Arreter la création',
                    style: TextStyle(
                        color: Colors.white), // Text color set to white
                  ),
                ),
                ElevatedButton(
                  onPressed: startGame,
                  style: ElevatedButton.styleFrom(
                      backgroundColor: const Color.fromARGB(255, 194, 43, 181)),
                  child: const Text(
                    'Commencer',
                    style: TextStyle(
                        color: Colors.white), // Text color set to white
                  ),
                ),
              ],
            ),
          ]),
        ));
  }

  void startGame() {
    socketService.startClassicGame();
  }

  void stopCreation() {
    // Logic to stop the game creation
    socketService.deleteWaitingRoom(widget.ownerId);
    Navigator.pop(context);
    ChatService chatService = Get.find<ChatService>();
    final userProvider = Provider.of<UserProvider>(context, listen: false);
    chatService.leavePrivateChannel(userProvider.user!.uid);
  }
}
