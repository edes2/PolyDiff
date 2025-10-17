import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:mobile/classes/args.dart';
import 'package:mobile/classes/enums.dart';
import 'package:mobile/classes/game.dart';
import 'package:mobile/providers/user_provider.dart';
import 'package:mobile/services/chat_service.dart';
import 'package:mobile/services/socket_service.dart';
import 'package:provider/provider.dart';

// Ces cards seront pour rejoindre des parties qui sont hostés, dans classic_selection.

class JoinableGameCard extends StatefulWidget {
  final Game game;
  final Player host;
  List<String> playerList;

  JoinableGameCard(
      {super.key,
      required this.game,
      required this.host,
      required this.playerList});

  @override
  JoinableGameCardState createState() => JoinableGameCardState();
}

class JoinableGameCardState extends State<JoinableGameCard> {
  int inputValue = 90; // Default value
  bool switchValue = false; // Default value
  final socketService = Get.find<SocketClientService>();

  @override
  void initState() {
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.all(8.0),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          ListTile(
            visualDensity: const VisualDensity(vertical: 4),
            leading: Image.memory(
              base64Decode(widget.game.imageUrl),
              width: 125,
              height: 250,
              fit: BoxFit.cover,
            ),
            title: Text(
              'Nom du créateur: ${widget.host.username}\n${widget.game.name}',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            subtitle: Column(
              crossAxisAlignment:
                  CrossAxisAlignment.start, // Align text to the start
              children: <Widget>[
                Text('Nombre de différences: ${widget.game.diffCount}'),
                Text(
                    'Difficulté: ${widget.game.difficulty == Difficulty.facile ? 'Facile' : 'Difficile'}'),
                if (widget.game.rating != null)
                  Row(
                    children: <Widget>[
                      Text('Note: ${widget.game.rating!.toStringAsFixed(1)}'),
                      const Icon(Icons.star,
                          color: Colors.amber), // Add a star icon
                    ],
                  ),
                if (widget.game.numberOfRatings != null)
                  Text('Nombre de notes: ${widget.game.numberOfRatings}'),
              ],
            ),
            trailing: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color.fromARGB(255, 194, 43, 181),
              ),
              onPressed: () {
                socketService.joinMultiGame(widget.host.uid, (data) {
                  final userProvider =
                      Provider.of<UserProvider>(context, listen: false);
                  final ChatService chatService = Get.find<ChatService>();
                  chatService.createPrivateChannel(
                      'PrivateChat: ${data['roomId']}', userProvider.user!.uid);
                });
                Navigator.pushNamed(context, '/joinerWaitingRoom',
                    arguments: JoinerWaitingRoomArgs(
                        ownerId: widget.host.uid,
                        playerList: widget.playerList,
                        gameMode: GameMode.classic));
              },
              child: const Text('Joindre',
                  style: TextStyle(color: Colors.white)),
            ),
          ),
          // Always show player list
          Padding(
            padding: const EdgeInsets.only(left: 16.0, top: 8.0, bottom: 8.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children:
                  widget.playerList.map((player) => Text(player)).toList(),
            ),
          ),
        ],
      ),
    );
  }
}
