import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:mobile/constants/constants.dart' as constants;
import 'package:mobile/providers/user_provider.dart';
import 'package:mobile/services/authentication.dart';
import 'package:mobile/services/profile_configuration.dart';
import 'package:mobile/services/socket_service.dart';
import 'package:provider/provider.dart';

class SignUpPage extends StatefulWidget {
  const SignUpPage({super.key});

  @override
  _SignUpPageState createState() => _SignUpPageState();
}

class _SignUpPageState extends State<SignUpPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController passController = TextEditingController();
  final FocusNode emailFocusNode = FocusNode();
  final authService = Get.find<AuthenticationService>();
  final profileConfigService = Get.find<ProfileConfigService>();
  final socketService = Get.find<SocketClientService>();

  String username = '';
  String email = '';
  String password = '';

  @override
  void initState() {
    super.initState();
    // socketService.disconnect();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      emailFocusNode.requestFocus();
    });
  }

  @override
  void dispose() {
    emailFocusNode.dispose();
    passController.dispose();
    super.dispose();
  }

  void _submit() async {
    if (_formKey.currentState!.validate()) {
      _formKey.currentState!.save();

      try {
        final userProvider = Provider.of<UserProvider>(context, listen: false);
        final success = await authService.signUp(email, password, username);

        if (!success) {
          throw Exception('Erreur');
        }

        userProvider.user = await authService.fetchUser();
        String? token = await authService.getToken();

        bool safeConnection = false;
        if (token != null) {
          safeConnection = await socketService.initConnection(token);
        }

        userProvider.user = await authService.fetchUser();

        if (userProvider.user?.uid != null) {
          // await socketService.initConnection(token!);
          final avatarUrl = await profileConfigService
              .getImageBase64('assets/images/default-avatar.png');
          final successAvatar = await profileConfigService.putAvatar(
              userProvider.user!.uid, avatarUrl);
          if (!successAvatar) {
            throw Exception('Incapable de mettre à jour l\'avatar');
          }
          // final successLanguage = await profileConfigService
          //     .updateLanguagePreference('Fr', userProvider.user!.uid);
          // if (!successLanguage) {
          //   throw Exception('Incapable de mettre à jour la langue');
          // }
          // final successTheme = await profileConfigService.updateThemePreference(
          //     'dark', userProvider.user!.uid);
          // if (!successTheme) {
          //   throw Exception('Incapable de mettre à jour le thème');
          // }
        } else {
          throw Exception('Erreur, le userProvider.user.uid n est pas defini');
        }
        // Get.find<ChatService>()
        //     .joinNewChannel('General', userProvider.user!.uid);
        Navigator.pushNamed(context, '/home');
      } on Exception catch (_) {
        ScaffoldMessenger.of(context).clearSnackBars();
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Erreur')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: constants.backgroundColor,
      body: Center(
        child: SingleChildScrollView(
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
                      decoration: InputDecoration(
                        labelText: "Nom d'utilisateur".tr,
                        prefixIcon: const Icon(Icons.person),
                      ),
                      autocorrect: false,
                      keyboardType: TextInputType.name,
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return "Nom d'utilisateur invalide".tr;
                        }
                        return null;
                      },
                      onSaved: (value) {
                        if (value != null) {
                          username = value;
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
                      obscureText: true,
                      decoration: InputDecoration(
                        labelText: 'Mot de passe'.tr,
                        prefixIcon: const Icon(Icons.lock),
                      ),
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
                      obscureText: true,
                      decoration: InputDecoration(
                        labelText: 'Confirmez votre mot de passe'.tr,
                        prefixIcon: const Icon(Icons.lock),
                      ),
                      validator: (value) {
                        if (value == null ||
                            value.trim().isEmpty ||
                            value != passController.text) {
                          return 'Est différent de votre mot de passe.'.tr;
                        }
                        return null;
                      },
                    ),
                  ),
                  const SizedBox(height: 20.0),
                  SizedBox(
                    width:
                        320, // Largeur réduite par rapport aux champs de saisie
                    child: Row(
                      children: <Widget>[
                        Expanded(
                          child: ElevatedButton(
                            onPressed: _submit,
                            style: ElevatedButton.styleFrom(
                              foregroundColor:
                                  const Color.fromARGB(255, 255, 255, 255),
                              backgroundColor: const Color.fromARGB(
                                  255, 194, 43, 181), // Couleur du texte
                            ),
                            child: Text(
                              'Créer votre compte'.tr,
                              style: const TextStyle(
                                  color: Color.fromARGB(
                                      255, 255, 253, 253)), // Style du texte
                            ),
                          ),
                        ),
                        const SizedBox(width: 10), // Espace entre les boutons
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () {
                              Navigator.pop(context);
                            },
                            style: ElevatedButton.styleFrom(
                              foregroundColor: Colors.black,
                              backgroundColor: Colors.grey, // Couleur du texte
                            ),
                            child: Text('Retour'.tr),
                          ),
                        ),
                      ],
                    ),
                  ),
                  // ... Autres champs de saisie ...
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
