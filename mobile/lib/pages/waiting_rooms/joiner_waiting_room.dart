import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:mobile/classes/enums.dart';
import 'package:mobile/providers/user_provider.dart';
import 'package:mobile/services/socket_service.dart';
import 'package:mobile/widgets/custom_scaffold.dart';
import 'package:provider/provider.dart';

class JoinerWaitingRoom extends StatefulWidget {
  final String ownerId; // Add ownerId field
  final List<String> playerList;
  final GameMode gameMode;
  // Update the constructor to accept ownerId
  JoinerWaitingRoom(
      {Key? key,
      required this.ownerId,
      required this.playerList,
      required this.gameMode})
      : super(key: key);

  @override
  _JoinerWaitingRoomState createState() => _JoinerWaitingRoomState();
}

class _JoinerWaitingRoomState extends State<JoinerWaitingRoom> {
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
          players.add(player['username'] ?? ''); // Add username
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
      body: Column(
        children: [
          // Text at the top
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Text(
              'En attente que le créateur commence la partie',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white,),
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
                onPressed: leaveGame,
                child: Text(
                  'Arreter la création',
                  style:
                      TextStyle(color: Colors.white), // Text color set to white
                ),
                style: ElevatedButton.styleFrom(primary: Colors.red),
              ),
            ],
          ),
        ],
      ),
    );
  }

  leaveGame() {
    final userProvider = Provider.of<UserProvider>(context, listen: false);
    socketService.quitWaitingRoom(widget.ownerId, userProvider.user!.uid);
    Navigator.pop(context);
  }
}
