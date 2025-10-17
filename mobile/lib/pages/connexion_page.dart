import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:mobile/constants/constants.dart' as constants;

class ConnexionPage extends StatelessWidget {
  ConnexionPage({super.key});

  final ButtonStyle inButtonStyle = TextButton.styleFrom(
      foregroundColor: Colors.white,
      backgroundColor: const Color.fromARGB(255, 194, 43, 181),
      fixedSize: const Size(300, 50));
  final ButtonStyle upButtonStyle = TextButton.styleFrom(
      foregroundColor: Colors.white,
      backgroundColor: const Color.fromARGB(255, 202, 189, 202),
      fixedSize: const Size(300, 50));
  final double textFontSize = 18;
  final Color backgroundColor = const Color.fromARGB(255, 28, 26, 29);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        backgroundColor: backgroundColor,
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              Image.asset(
                constants.logoPath,
                scale: 1.5,
              ),
              const SizedBox(height: 50),
              TextButton(
                  onPressed: () {
                    Navigator.pushNamed(context, '/signIn');
                  },
                  style: inButtonStyle,
                  child: Text('Connexion',
                      style: TextStyle(fontSize: textFontSize))),
              const SizedBox(height: 10),
              TextButton(
                  onPressed: () {
                    Navigator.pushNamed(context, '/signUp');
                  },
                  style: upButtonStyle,
                  child: Text('Création de compte',
                      style: TextStyle(
                          fontSize: textFontSize, color: Colors.black))),
            ],
          ),
        ));
  }
}
