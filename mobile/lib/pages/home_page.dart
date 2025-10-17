import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:mobile/constants/constants.dart' as constants;
import 'package:mobile/services/chat_service.dart';
import 'package:mobile/widgets/custom_scaffold.dart';

class HomePage extends StatelessWidget {
  HomePage({super.key});

  final Color backgroundColor = const Color.fromARGB(255, 28, 26, 29);
  final String logoPath = constants.logoPath;
  final ButtonStyle buttonStyle = TextButton.styleFrom(
      foregroundColor: Colors.white,
      backgroundColor: const Color.fromARGB(255, 194, 43, 181),
      fixedSize: const Size(300, 50));
  final double textFontSize = 18;
  final chatService = Get.find<ChatService>();

  @override
  Widget build(BuildContext context) {
    return CustomScaffold(
        automaticallyImplyLeading: false,
        body: Container(
          color: backgroundColor,
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Image.asset(
                      logoPath,
                      scale: 1.5,
                    ),
                    const SizedBox(width: 40),
                    Column(
                      children: [
                        const Text(
                          "Erratum",
                          style: TextStyle(
                              color: Colors.purple,
                              fontSize: 40,
                              fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 10),
                        TextButton(
                          onPressed: () {
                            Navigator.pushNamed(context, '/classicSelect');
                          },
                          style: buttonStyle,
                          child: Text(
                            'Mode classique',
                            style: TextStyle(fontSize: textFontSize),
                          ),
                        ),
                        const SizedBox(height: 10),
                        TextButton(
                          onPressed: () {
                            Navigator.pushNamed(context, '/limitedSelect');
                          },
                          style: buttonStyle,
                          child: Text(
                            'Mode temps limité',
                            style: TextStyle(fontSize: textFontSize),
                          ),
                        ),
                        const SizedBox(height: 10),
                        TextButton(
                          onPressed: () {
                            Navigator.pushNamed(context, '/zenPage');
                          },
                          style: buttonStyle,
                          child: Text(
                            'Mode zen',
                            style: TextStyle(fontSize: textFontSize),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 96),
                Text(
                  'Équipe 101',
                  style: TextStyle(color: Colors.white, fontSize: textFontSize),
                ),
                Text(
                  'Etienne, Nina, Nassour, Ghali, Amir et Reda',
                  style: TextStyle(color: Colors.white, fontSize: textFontSize),
                ),
              ],
            ),
          ),
        ));
  }
}
