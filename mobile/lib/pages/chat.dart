import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:mobile/constants/constants.dart' as constants;
import 'package:mobile/widgets/chat_messages.dart';
import 'package:mobile/widgets/new_messages.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => ChatScreenState();
}

class ChatScreenState extends State<ChatScreen> {
  IO.Socket socket = IO.io(constants.fastApiPath, {
    'path': '/ws',
    'transports': ['websocket'],
    'upgrade': false,
    'autoConnect': false,
  });

  @override
  void initState() {
    super.initState();
    socket.connect();
  }

  final chatMessagesKey = GlobalKey<ChatMessagesState>();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Salle de chat'.tr),
      ),
      body: Column(
        children: [
          Expanded(
            child: ChatMessages(
              socket: socket,
              key: chatMessagesKey,
            ),
          ),
          NewMessage(
            socket: socket,
            scrollToBottom: chatMessagesKey.currentWidget is ChatMessages
                ? (chatMessagesKey.currentWidget as ChatMessages).scrollToBottom
                : () {},
          ),
        ],
      ),
    );
  }
}
