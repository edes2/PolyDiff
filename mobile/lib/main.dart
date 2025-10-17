import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_phoenix/flutter_phoenix.dart';
import 'package:get/get.dart';
import 'package:mobile/classes/args.dart';
import 'package:mobile/classes/languages.dart';
import 'package:mobile/constants/constants.dart' as constants;
import 'package:mobile/pages/classic/classic_creation.dart';
import 'package:mobile/pages/classic/classic_game_page.dart';
import 'package:mobile/pages/classic/classic_selection.dart';
import 'package:mobile/pages/connexion_page.dart';
import 'package:mobile/pages/home_page.dart';
import 'package:mobile/pages/limited_time/limited_game_page.dart';
import 'package:mobile/pages/limited_time/limited_selection.dart';
import 'package:mobile/pages/profile_page.dart';
import 'package:mobile/pages/sign_in_page.dart';
import 'package:mobile/pages/sign_up_page.dart';
import 'package:mobile/pages/waiting_rooms/creator_waiting_room.dart';
import 'package:mobile/pages/waiting_rooms/joiner_waiting_room.dart';
import 'package:mobile/pages/zen/zen_game_page.dart';
import 'package:mobile/pages/zen/zen_page.dart';
import 'package:mobile/providers/user_provider.dart';
import 'package:mobile/services/authentication.dart';
import 'package:mobile/services/chat_service.dart';
import 'package:mobile/services/communication_service.dart';
import 'package:mobile/services/game_manager_service.dart';
import 'package:mobile/services/profile_configuration.dart';
import 'package:mobile/services/socket_service.dart';
import 'package:mobile/services/zen_mode.dart';
import 'package:provider/provider.dart';

import 'firebase_options.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  print('SERVER STARTING IN PRODUCTION: ' + constants.production.toString());

  Get.put(ChatService());
  Get.put(AuthenticationService());
  Get.put(SocketClientService());
  Get.put(CommunicationService());
  Get.put(ProfileConfigService());
  Get.put(GameManagerService());
  Get.put(ZenModeService());

  runApp(
    Phoenix(
      child: MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => UserProvider()),
        ],
        child: const MyApp(),
      ),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return GetMaterialApp(
      title: constants.title,
      translations: AppLocalizations(),
      locale: const Locale('en', 'US'),
      routes: {
        '/signUp': (context) => const SignUpPage(),
        '/signIn': (context) => const SignInPage(),
        '/home': (context) => HomePage(),
        '/connexion': (context) => ConnexionPage(),
        '/classicSelect': (context) => ClassicSelection(),
        '/limitedSelect': (context) => LimitedSelection(),
        '/classicCreate': (context) => ClassicCreation(),
        '/profilePage': (context) => const ProfilePage(),
        '/zenPage': (context) => ZenPage(),
        '/zenGamePage': (context) => ZenGamePage(),
      },
      onGenerateRoute: (settings) {
        if (settings.name == '/creatorWaitingRoom') {
          final args = settings.arguments as CreatorWaitingRoomArgs;
          return MaterialPageRoute(
            builder: (context) => CreatorWaitingRoom(
              ownerId: args.ownerId,
              gameMode: args.gameMode,
            ),
          );
        }
        if (settings.name == '/joinerWaitingRoom') {
          final args = settings.arguments as JoinerWaitingRoomArgs;
          return MaterialPageRoute(
            builder: (context) => JoinerWaitingRoom(
              ownerId: args.ownerId,
              playerList: args.playerList,
              gameMode: args.gameMode,
            ),
          );
        }
        if (settings.name == '/gameClassicPage') {
          final args = settings.arguments as String;
          return MaterialPageRoute(
            builder: (context) => ClassicGamePage(
              ownerId: args,
            ),
          );
        }
        if (settings.name == '/gameLimitedPage') {
          final args = settings.arguments as String;
          return MaterialPageRoute(
            builder: (context) => LimitedGamePage(
              ownerId: args,
            ),
          );
        }
        // Handle other dynamic routes or return null
        return null;
      },
      initialRoute: '/connexion',
      theme: ThemeData().copyWith(
          useMaterial3: true,
          colorScheme: ColorScheme.fromSeed(
              seedColor: const Color.fromARGB(54, 236, 0, 0))),
    );
  }
}
