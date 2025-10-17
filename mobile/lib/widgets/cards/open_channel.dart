import 'package:flutter/material.dart';

// Ces cards sont pour les canaux que l'utilisateur n'a pas rejoint.

class OpenChannelCard extends StatelessWidget {
  final String chatName;
  final VoidCallback onJoin;
  final VoidCallback onDelete;

  const OpenChannelCard({
    Key? key,
    required this.chatName,
    required this.onJoin,
    required this.onDelete,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
        margin: const EdgeInsets.all(8.0),
        child: InkWell(
          onTap: onJoin,
          child: Padding(
            padding:
                const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: <Widget>[
                Expanded(
                  child: Text(
                    chatName,
                    style: const TextStyle(
                      fontSize: 18.0,
                      fontWeight: FontWeight.bold,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: <Widget>[
                    TextButton(
                      onPressed: onJoin,
                      child: const Text('Joindre'),
                    ),
                    const SizedBox(width: 8.0), // Spacing between buttons
                    TextButton(
                      onPressed: onDelete,
                      style: TextButton.styleFrom(
                        foregroundColor: Colors.red, // Button text color
                      ),
                      child: const Text('Supprimer'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ));
  }
}
