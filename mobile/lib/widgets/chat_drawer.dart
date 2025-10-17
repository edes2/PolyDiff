import 'package:flutter/material.dart';
import 'package:mobile/pages/chat.dart';

class ChatDrawer extends StatelessWidget {
  const ChatDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    return Drawer(
        width: MediaQuery.of(context).size.width * 0.7, child: ChatScreen());
  }
}
