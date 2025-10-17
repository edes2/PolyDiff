import 'dart:async';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:mobile/constants/constants.dart' as constants;
import 'package:mobile/providers/user_provider.dart';
import 'package:mobile/services/chat_service.dart';
import 'package:mobile/services/socket_service.dart';
import 'package:provider/provider.dart';

import '../services/authentication.dart';

final firebase = FirebaseAuth.instance;

class SignInPage extends StatefulWidget {
  const SignInPage({super.key});

  @override
  _SignInPageState createState() => _SignInPageState();
}

class _SignInPageState extends State<SignInPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController passController = TextEditingController();
  final TextEditingController emailController = TextEditingController();
  final FocusNode emailFocusNode = FocusNode();

  final authService = Get.find<AuthenticationService>();

  String email = '';
  String password = '';
  bool resetButtonEnabled = true;

  bool _isObscured = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      emailFocusNode.requestFocus();
    });
  }

  @override
  void dispose() {
    emailFocusNode.dispose();
    passController.dispose();
    emailController.dispose();
    super.dispose();
  }

  void _submit() async {
    if (_formKey.currentState!.validate()) {
      _formKey.currentState!.save();
    }

    try {
      final userProvider = Provider.of<UserProvider>(context, listen: false);
      final socketService = Get.find<SocketClientService>();

      final success = await authService.signIn(email, password);

      if (!success) {
        throw Exception();
      }

      userProvider.user = await authService.fetchUser();

      bool safeConnection = false;

      String? token = await authService.getToken();

      if (token != null) {
        safeConnection = await socketService.initConnection(token);
      }
      if (safeConnection) {
        Get.find<ChatService>().getJoinedChannels(userProvider.user!.uid);

        // print(userProvider.user!.themePreference);
        // if (userProvider.user!.themePreference == 'dark') {
        //   Get.changeTheme(ThemeData.dark());
        // } else {
        //   Get.changeTheme(ThemeData.light());
        // }
        // print(userProvider.user!.languagePreference);
        // if (userProvider.user!.languagePreference == 'Fr') {
        //   Get.updateLocale(const Locale('fr', 'FR'));
        // } else {
        //   Get.updateLocale(const Locale('en', 'US'));
        // }
        Navigator.pushNamed(context, '/home');
      } else {
        ScaffoldMessenger.of(context).clearSnackBars();
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content:
                Text('Vous êtes déjà connecté sur un autre utilisateur.'.tr)));
      }
    } on Exception catch (_) {
      ScaffoldMessenger.of(context).clearSnackBars();
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(
              'Votre addresse courriel ou mot de passe est incorrect.'.tr)));
    }
  }

  Future<void> _resetPassword(String email) async {
    try {
      await authService.resetPassword(email);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Email de réinitialisation envoyé")),
      );
    } on FirebaseAuthException catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Erreur: ${e.message}")),
      );
    }
  }

  void _disableButtonTemporarily() {
    setState(() {
      resetButtonEnabled = false;
    });

    Timer(const Duration(seconds: 10), () {
      setState(() {
        resetButtonEnabled = true;
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        backgroundColor: constants.backgroundColor,
        resizeToAvoidBottomInset: true,
        body: Center(
          child: Center(
              child: SingleChildScrollView(
            child: Padding(
                padding: EdgeInsets.only(
                    bottom: MediaQuery.of(context).viewInsets.bottom),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      mainAxisSize: MainAxisSize.min,
                      children: <Widget>[
                        Image.asset(
                          constants.logoPath,
                          scale: 1.5,
                        ),
                        const SizedBox(height: 20.0),
                        Container(
                          width: 350,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(8.0),
                          ),
                          child: TextFormField(
                            focusNode: emailFocusNode,
                            controller: emailController,
                            decoration: InputDecoration(
                              labelText: 'Courriel'.tr,
                              prefixIcon: const Icon(Icons.email),
                            ),
                            autocorrect: false,
                            keyboardType: TextInputType.emailAddress,
                            validator: (value) {
                              if (value == null ||
                                  value.trim().isEmpty ||
                                  !value.contains('@')) {
                                return 'Addresse courriel invalide'.tr;
                              }
                              return null;
                            },
                            onSaved: (value) {
                              if (value != null) {
                                email = value;
                              }
                            },
                          ),
                        ),
                        const SizedBox(height: 20.0),
                        Container(
                          width: 350,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(8.0),
                          ),
                          child: TextFormField(
                            controller: passController,
                            obscureText: _isObscured,
                            decoration: InputDecoration(
                                labelText: 'Mot de passe'.tr,
                                prefixIcon: const Icon(Icons.lock),
                                suffixIcon: IconButton(
                                  icon: Icon(_isObscured
                                      ? Icons.visibility
                                      : Icons.visibility_off),
                                  onPressed: () {
                                    setState(() {
                                      _isObscured = !_isObscured;
                                    });
                                  },
                                )),
                            autocorrect: false,
                            validator: (value) {
                              if (value == null || value.trim().isEmpty) {
                                return 'Mot de passe invalide'.tr;
                              }
                              return null;
                            },
                            onSaved: (value) {
                              if (value != null) {
                                password = value;
                              }
                            },
                            onFieldSubmitted: (value) {
                              _submit();
                            },
                          ),
                        ),
                        const SizedBox(height: 20.0),
                        ButtonBar(
                          alignment: MainAxisAlignment.center,
                          buttonPadding:
                              const EdgeInsets.symmetric(horizontal: 10),
                          children: <Widget>[
                            ElevatedButton(
                              onPressed: _submit,
                              style: ElevatedButton.styleFrom(
                                backgroundColor:
                                    const Color.fromARGB(255, 194, 43, 181),
                                minimumSize:
                                    const Size(150, 36), // Set a minimum size
                              ),
                              child: Text('Connexion'.tr,
                                  style: const TextStyle(
                                      color:
                                          Color.fromARGB(255, 255, 255, 255))),
                            ),
                            ElevatedButton(
                              onPressed: () {
                                Navigator.pop(context);
                              },
                              style: ElevatedButton.styleFrom(
                                minimumSize: const Size(150,
                                    36), // Ensure the size matches the other button
                                backgroundColor: Colors.grey,
                              ),
                              child: Text(
                                'Retour'.tr,
                                style: const TextStyle(color: Colors.black),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 20.0),
                        InkWell(
                          onTap: () async {
                            // Call the reset password function
                            if (emailController.text == null ||
                                emailController.text.trim().isEmpty ||
                                !emailController.text.contains('@')) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                    content: Text(
                                        "Un courriel valide est requis pour la réinitialisation du mot de passe")),
                              );
                            } else if (!resetButtonEnabled) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                      content: Text(
                                          "Cette action est limitée à une fois par 10 secondes")));
                            } else {
                              await _resetPassword(emailController.text);
                              _disableButtonTemporarily();
                            }
                          },
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            child: Text(
                              'Réinitialiser le mot de passe'.tr,
                              style: TextStyle(
                                color: Theme.of(context).primaryColor,
                                decoration: TextDecoration.underline,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                )),
          )),
        ));
  }
}
