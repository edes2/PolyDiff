import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:mobile/classes/args.dart';
import 'package:mobile/classes/enums.dart';
import 'package:mobile/classes/game.dart';
import 'package:mobile/providers/user_provider.dart';
import 'package:mobile/services/chat_service.dart';
import 'package:mobile/services/socket_service.dart';
import 'package:provider/provider.dart';

// Ces game cards seront affichés dans la page de création de jeu pour créer une nouvelle partie.

class GameCard extends StatefulWidget {
  final Game game;

  const GameCard({super.key, required this.game});

  @override
  GameCardState createState() => GameCardState();
}

class GameCardState extends State<GameCard> {
  int inputValue = 90; // Default value
  bool switchValue = false; // Default value
  double rating = 5.0;
  final socketService = Get.find<SocketClientService>();

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.all(8.0),
      child: InkWell(
        onTap: () => _showModal(context),
        child: ListTile(
          visualDensity: const VisualDensity(vertical: 4),
          leading: Image.memory(
            base64Decode(widget.game.imageUrl),
            width: 125,
            height: 250,
            fit: BoxFit.cover,
          ),
          title: Text(
            widget.game.name,
            style: const TextStyle(
              fontWeight: FontWeight.bold,
            ),
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
              _showModal(context);
            },
            child: const Text('SELECTIONNER', style: TextStyle(color: Colors.white)),
          ),
        ),
      ),
    );
  }

  void _showModal(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (BuildContext context) {
        return StatefulBuilder(
          builder: (BuildContext context, StateSetter setModalState) {
            return Container(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                        labelText: "Durée de jeu: ",
                        hintText: inputValue.toString()),
                    inputFormatters: <TextInputFormatter>[
                      FilteringTextInputFormatter.digitsOnly
                    ],
                    onChanged: (value) {
                      inputValue = int.tryParse(value) ?? 0;
                    },
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text("Activer le mode triche:"),
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
                        onPressed: () {
                          Navigator.pop(context); // Close the modal
                        },
                        child: const Text('Fermer'),
                      ),
                      ElevatedButton(
                        onPressed: () {
                          final userProvider =
                              Provider.of<UserProvider>(context, listen: false);
                          // Navigator.pop(context); // Close the modal
                          if (userProvider.user == null) return;
                          socketService.createClassicGame(
                              GameStartInfo(
                                  cardId: widget.game.cardId,
                                  gameDuration: inputValue,
                                  allowCheat: switchValue), (data) {
                            Navigator.pushNamed(context, '/creatorWaitingRoom',
                                arguments: CreatorWaitingRoomArgs(
                                    ownerId: userProvider.user!.uid,
                                    gameMode: GameMode.classic));
                            final ChatService chatService =
                                Get.find<ChatService>();
                            chatService.createPrivateChannel(
                                'PrivateChat: ${data['roomId']}',
                                userProvider.user!.uid);
                          });
                        },
                        child: const Text('Soumettre'),
                      ),
                    ],
                  )
                ],
              ),
            );
          },
        );
      },
    );
  }
}
