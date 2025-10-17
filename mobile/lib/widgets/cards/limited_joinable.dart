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

class LimitedGameCard extends StatefulWidget {
  final Player host;
  List<String> playerList;

  LimitedGameCard({super.key, required this.host, required this.playerList});

  @override
  LimitedGameCardState createState() => LimitedGameCardState();
}

class LimitedGameCardState extends State<LimitedGameCard> {
  int inputValue = 90; // Default value
  bool switchValue = false; // Default value
  double rating = 5.0;
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
            title: Text(
              'Nom du créateur: ${widget.host.username}',
              style: const TextStyle(fontWeight: FontWeight.bold),
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
                        gameMode: GameMode.limitedTime));
                // TODO: implement join game
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
