import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:mobile/classes/channel.dart';

// Ces cards sont pour le canaux que l'utilisateur à déjà rejoint.

class JoinedChannelCard extends StatelessWidget {
  final JoinableChannel channel;
  final VoidCallback onOpen;
  final VoidCallback onLeave;

  const JoinedChannelCard({
    Key? key,
    required this.channel,
    required this.onOpen,
    required this.onLeave,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
        margin: const EdgeInsets.all(8.0),
        child: InkWell(
          onTap: onOpen,
          child: Padding(
            padding:
                const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: <Widget>[
                Expanded(
                  child: Obx(
                    () => Text(
                      channel.channelName.startsWith('PrivateChat:')
                          ? 'Chat de partie'
                          : channel.channelName,
                      style: TextStyle(
                        fontSize: 18.0,
                        fontWeight: channel.unread.value
                            ? FontWeight.bold
                            : FontWeight.normal,
                        color: channel.unread.value ? Colors.red : Colors.black,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: <Widget>[
                    TextButton(
                      onPressed: onOpen,
                      child: const Text('Ouvrir'),
                    ),
                    const SizedBox(width: 8.0), // Spacing between buttons
                    if ((channel.channelName != 'General') &&
                        (!channel.channelName.startsWith('PrivateChat: ')))
                      TextButton(
                        onPressed: onLeave,
                        style: TextButton.styleFrom(
                          foregroundColor: Colors.red,
                        ),
                        child: const Text('Sortir'),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ));
  }
}
