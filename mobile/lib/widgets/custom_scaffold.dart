import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:mobile/services/authentication.dart';
import 'package:mobile/services/chat_service.dart';
import 'package:mobile/services/communication_service.dart';
import 'package:mobile/services/game_manager_service.dart';
import 'package:mobile/services/profile_configuration.dart';
import 'package:mobile/services/socket_service.dart';
import 'package:mobile/services/zen_mode.dart';
import 'package:mobile/widgets/chat_drawer.dart';

class CustomScaffold extends StatelessWidget {
  final Widget body;
  final bool automaticallyImplyLeading;
  final Color backgroundColor;
  CustomScaffold(
      {super.key,
      required this.body,
      required this.automaticallyImplyLeading,
      this.backgroundColor = const Color.fromARGB(255, 43, 41, 41)});

  final chatService = Get.find<ChatService>();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: const ChatDrawer(),
      appBar: AppBar(
          leading: Builder(
            builder: (context) => IconButton(
              icon: Obx(() => Icon(Icons.forum,
                  color:
                      chatService.hasUnreadMessage.value ? Colors.red : null)),
              onPressed: () {
                Scaffold.of(context).openDrawer();
                chatService.hasUnreadMessage.value = false;
              },
            ),
          ),
          actions: [
            IconButton(
              onPressed: () async {
                FirebaseAuth.instance.signOut();
                SocketClientService socketService =
                    Get.find<SocketClientService>();
                socketService.disconnect();
                await Get.deleteAll(force: true);
                // Phoenix.rebirth(context);
                Get.reset();
                Get.put(ChatService());
                Get.put(AuthenticationService());
                Get.put(SocketClientService());
                Get.put(CommunicationService());
                Get.put(ProfileConfigService());
                Get.put(GameManagerService());
                Get.put(ZenModeService());
                Navigator.popUntil(context, ModalRoute.withName('/connexion'));
              },
              icon: const Icon(Icons.exit_to_app),
            ),
            IconButton(
              onPressed: () {
                Navigator.pushNamed(context, '/profilePage');
              },
              icon: const Icon(Icons.person),
            ),
          ]),
      backgroundColor: backgroundColor,
      body: body,
    );
  }
}
