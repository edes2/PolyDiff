import 'dart:convert';
import 'dart:io';

import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/material.dart';
import 'package:flutter_sound/flutter_sound.dart';
import 'package:get/get.dart';
import 'package:image/image.dart' as img;
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:mobile/classes/game.dart';
import 'package:mobile/classes/history.dart';
import 'package:mobile/classes/user.dart';
import 'package:mobile/providers/user_provider.dart';
import 'package:mobile/services/authentication.dart';
import 'package:mobile/services/profile_configuration.dart';
import 'package:provider/provider.dart';

// import 'package:shared_preferences/shared_preferences.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  _ProfilePageState createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _usernameController = TextEditingController();
  final AudioPlayer audioPlayer = AudioPlayer();
  bool isRecording = false;
  String audioPath = '';
  final recorder = FlutterSoundRecorder();
  List<String> recordedSounds = [];
  String selectedErrorPath = '';

  // state variables for selected sounds
  int selectedErrorSound = 0;
  int selectedDifferenceSound = 0;

  late UserProfile user = UserProfile(
      uid: '1',
      username: 'Lorem',
      email: 'lorem@ipsum.com',
      languagePreference: 'En',
      themePreference: 'light');

  // String _isEnglish = '';
  // String _themePreference = '';
  String avatarUrl = '';
  String avatarPath = '';
  RxString averageGameDuration = ''.obs;

  RxInt gamesPlayed = 0.obs;
  RxInt gamesWon = 0.obs;

  RxDouble averageDiff = 0.0.obs;

  bool isLoading = false;

  List<EnrichedGameHistory> gameHistory = [];
  List<dynamic> userConnections = [];

  final AuthenticationService authService = Get.find<AuthenticationService>();
  final ProfileConfigService profileConfigService =
      Get.find<ProfileConfigService>();

  @override
  void initState() {
    initRecorder();
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    fetchUserInfo();
    // _loadLanguagePreference();
    // _loadThemePreference();
  }

  @override
  void dispose() {
    audioPlayer.dispose();
    recorder.closeRecorder();
    _tabController.dispose();
    super.dispose();
  }

  Future initRecorder() async {
    await recorder.openRecorder();
  }

  Future stop() async {
    final path = await recorder.stopRecorder();
    setState(() {
      isRecording = false;
      audioPath = path!;
    });
  }

  Future playRecording(String path) async {
    try {
      Source urlSource = UrlSource(path);
      await audioPlayer.play(urlSource);
    } catch (e) {
      print('error playing recording');
    }
  }

  Future record() async {
    await audioPlayer.stop();
    await recorder.startRecorder(toFile: 'audio');
    setState(() {
      isRecording = true;
    });
  }

  Future _pickImage() async {
    showModalBottomSheet(
      context: context,
      builder: (context) {
        return Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: Text('Prendre une photo'.tr),
              onTap: () {
                Navigator.pop(context);
                _takePicture();
              },
            ),
          ],
        );
      },
    );
  }

  Future _takePicture() async {
    final imagePicker = ImagePicker();
    final pickedImage = await imagePicker.pickImage(source: ImageSource.camera);

    if (pickedImage != null) {
      final imageFile = File(pickedImage.path);
      submitAvatarFromCamera(imageFile);
    }
  }

  void submitAvatarFromCamera(File imageFile) async {
    try {
      final bytes = await imageFile.readAsBytes();
      img.Image? image = img.decodeImage(bytes);
      img.Image resizedImage = img.copyResize(image!, width: 128, height: 128);
      List<int> pngBytes = img.encodePng(resizedImage);
      final base64Image = base64Encode(pngBytes);
      final avatarUrl = 'data:image/png;base64,$base64Image';

      setState(() {
        this.avatarUrl = avatarUrl;
      });
      final succes = await profileConfigService.putAvatar(user.uid, avatarUrl);
      if (succes) {
        loadAvatarUrl();
      }
      final displayMessage = succes
          ? "L'avatar a été modifié avec succès".tr
          : "L'avatar n'a pas pu être modifié".tr;
      final displayMessageColor = succes ? Colors.green : Colors.red;
      showSnackBar(displayMessage, displayMessageColor);
    } catch (e) {
      print('Error in submitAvatarFromCamera: $e');
    }
  }

  void loadAvatarUrl() async {
    setState(() {
      isLoading = true;
    });
    final avatar = await profileConfigService.getAvatar(user.uid);
    setState(() {
      avatarUrl = avatar ?? '';
      isLoading = false;
    });
  }

  // void _loadThemePreference() async {
  //   SharedPreferences prefs = await SharedPreferences.getInstance();
  //   final storedTheme = prefs.getString('themePreference') ?? 'light';
  //   setState(() {
  //     _themePreference = storedTheme;
  //   });
  //   if (storedTheme == 'light') {
  //     Get.changeTheme(ThemeData.light());
  //   } else {
  //     Get.changeTheme(ThemeData.dark());
  //   }
  // }

  // void _toggleTheme(String theme) async {
  //   setState(() {
  //     _themePreference = theme;
  //   });
  //   if (theme == 'light') {
  //     Get.changeTheme(ThemeData.light());
  //   } else {
  //     Get.changeTheme(ThemeData.dark());
  //   }
  //   _updateThemePreference(theme);
  //   // SharedPreferences.getInstance().then((prefs) {
  //   //   prefs.setString('themePreference', theme);
  //   // });
  // }

  // void _updateThemePreference(String themePreference) async {
  //   final success = await profileConfigService.updateThemePreference(
  //       themePreference, user.uid);
  //   if (!success) {
  //     throw Exception('Failed to update theme preference on the server');
  //   }
  // }

  // void _loadLanguagePreference() async {
  //   SharedPreferences prefs = await SharedPreferences.getInstance();
  //   final storedLang = prefs.getString('languageCode') ?? 'En';
  //   setState(() {
  //     _isEnglish = storedLang;
  //   });
  //   Get.updateLocale(
  //       Locale(storedLang.toLowerCase(), storedLang == 'En' ? 'US' : 'FR'));
  // }

  // void _toggleLanguage(String value) async {
  //   setState(() {
  //     _isEnglish = value;
  //     print('this is my _isEnglish after toggle: $_isEnglish');
  //   });
  //   print('i am after setState');
  //   Get.updateLocale(Locale(value.toLowerCase(), value == 'En' ? 'US' : 'FR'));
  //   print('i am after Get.updateLocale');
  //   _updateLanguagePreference(value);
  //   print('i am after _updateLanguagePreference');
  //   // SharedPreferences.getInstance().then((prefs) {
  //   //   prefs.setString('languageCode', value);
  //   // });
  // }

  // void _updateLanguagePreference(String languagePreference) async {
  //   final succes = await profileConfigService.updateLanguagePreference(
  //       languagePreference, user.uid);
  //   if (!succes) {
  //     throw Exception('Failed to update language preference on server');
  //   }
  // }
  void fetchHistory() async {
    final history = await profileConfigService.getHistory(user.uid);
    setState(() {
      gameHistory = history;
    });
    calculateStats(history);
  }

  void fetchConnectionsHistory() async {
    print(user.uid);
    final connections =
        await profileConfigService.getConnectionsHistory(user.uid);
    setState(() {
      userConnections = connections;
    });
  }

  void fetchUserInfo() async {
    final userProvider = Provider.of<UserProvider>(context, listen: false);
    userProvider.user = await authService.fetchUser();
    if (userProvider.user != null) {
      setState(() {
        user = userProvider.user!;
        // print('this is my user: $user');
        // if (userProvider.user!.languagePreference == null) {
        //   print('it seems userProvide.user.language is null');
        //   userProvider.user!.languagePreference = 'En';
        //   _isEnglish = 'En';
        // } else {
        //   _isEnglish = userProvider.user!.languagePreference!;
        //   print('this is my _isEnglish: $_isEnglish');
        // }
        // if (user.themePreference == null) {
        //   print('it seems userProvide.user.theme is null');
        //   userProvider.user!.themePreference = 'dark';
        //   _themePreference = 'dark';
        // } else {
        //   _themePreference = userProvider.user!.themePreference!;
        //   print('this is my _themePreference: $_themePreference');
        // }
      });
      loadAvatarUrl();
      fetchHistory();
      fetchConnectionsHistory();
    }
  }

  void calculateStats(List<EnrichedGameHistory> history) {
    averageGameDuration.value =
        profileConfigService.calculateAverageGameDuration(history);
    gamesPlayed.value = profileConfigService.calculateGamesPlayed(history);
    gamesWon.value = profileConfigService.calculateGamesWon(history, user.uid);
    averageDiff.value =
        profileConfigService.calculateAverageDiff(history, user.uid);
  }

  void submitNewUsername() async {
    if (_usernameController.text.isEmpty) {
      return;
    }
    final succes =
        await profileConfigService.updateUsername(_usernameController.text);
    final displayMessage = succes
        ? "Le nom d'utilisateur a été changé avec succès".tr
        : "Le nom d'utilisateur est déjà pris".tr;
    final displayMessageColor = succes ? Colors.green : Colors.red;
    if (succes) {
      setState(() {
        user.username = _usernameController.text;
        _usernameController.clear();
      });
    }
    showSnackBar(displayMessage, displayMessageColor);
  }

  void submitAvatar() async {
    if (avatarPath.isNotEmpty) {
      final avatarImageUrl =
          await profileConfigService.getImageBase64(avatarPath);

      final succes =
          await profileConfigService.putAvatar(user.uid, avatarImageUrl);
      if (!succes) {
        throw Exception('Failed to update avatar on server');
      }
      loadAvatarUrl();
      final displayMessage = succes
          ? "L'avatar a été modifié avec succès".tr
          : "L'avatar n'a pas pu être modifié".tr;
      final displayMessageColor = succes ? Colors.green : Colors.red;
      showSnackBar(displayMessage, displayMessageColor);
    }
    return;
  }

  void showSnackBar(String message, Color color) {
    final snackBar = SnackBar(
      content: Text(message),
      backgroundColor: color,
      duration: const Duration(seconds: 2),
    );

    ScaffoldMessenger.of(context).showSnackBar(snackBar);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Profile'.tr),
        bottom: TabBar(
          controller: _tabController,
          tabs: [
            Tab(text: 'Les configurations de profile'.tr),
            Tab(text: 'Les statistiques de compte'.tr),
            Tab(text: 'Histoire des jeux'.tr),
          ],
        ),
      ),
      backgroundColor: const Color.fromARGB(255, 43, 41, 41),
      body: TabBarView(
        controller: _tabController,
        children: [
          buildProfileSettingsPage(),
          buildAccountStatistics(),
          buildGameHistory(),
        ],
      ),
    );
  }

  Widget buildAccountStatistics() {
    final dateFormat = DateFormat('yyyy-MM-dd HH:mm:ss');

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.all(8.0),
            child: Text(
              'Statistiques',
              style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.white),
            ),
          ),
          Card(
            margin: const EdgeInsets.all(8.0),
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                children: [
                  Text('Nombre de parties jouées: ${gamesPlayed.value}'),
                  const SizedBox(height: 8),
                  Text('Nombre de parties gagnées: ${gamesWon.value}'),
                  const SizedBox(height: 8),
                  Text(
                      'Moyenne de différence trouvée par partie: ${averageDiff.value.toStringAsFixed(2)}'),
                  const SizedBox(height: 8),
                  Text(
                      'Temps moyenne par partie: ${averageGameDuration.value}'),
                ],
              ),
            ),
          ),
          const Padding(
            padding: EdgeInsets.all(8.0),
            child: Text(
              'Connexions et Déconnexions',
              style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.white),
            ),
          ),
          ListView.builder(
            shrinkWrap: true,
            physics:
                const NeverScrollableScrollPhysics(), // Disable scrolling within ListView
            itemCount: userConnections.length,
            itemBuilder: (context, index) {
              // Accessing the connections in reverse order
              final connection = userConnections.reversed.toList()[index];
              return TimelineTile(
                connection: connection,
                dateFormat: dateFormat,
              );
            },
          ),
        ],
      ),
    );
  }

  Widget buildGameHistory() {
    return ListView.builder(
      itemCount: gameHistory.length,
      itemBuilder: (context, index) {
        final game = gameHistory[index];
        final bool isWinner = game.winnerId == user.uid;
        final Color winColor = isWinner ? Colors.green : Colors.red;

        return Card(
          margin: const EdgeInsets.all(8.0),
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Date de la partie: ${game.date}',
                    style: const TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Text('Temps de début de partie: ${game.startingTime}'),
                const SizedBox(height: 8),
                Text('Durée: ${game.duration}'),
                const SizedBox(height: 8),
                Text('Mode de jeu: ${game.gameMode}'),
                const SizedBox(height: 8),
                Text('Joueurs: ${game.playersUsername.join(', ')}'),
                const SizedBox(height: 8),
                if (game.gameMode != 'Temps limité')
                  RichText(
                    text: TextSpan(
                      text: 'Partie remportée: ',
                      style: TextStyle(
                          color: winColor, fontWeight: FontWeight.bold),
                      children: <TextSpan>[
                        TextSpan(
                          text: isWinner ? 'Oui' : 'Non',
                          style: TextStyle(color: winColor),
                        ),
                      ],
                    ),
                  ),
                if (game.rageQuittersId != null &&
                    game.rageQuittersId!.isNotEmpty)
                  Text('Rage Quitters: ${game.rageQuittersId!.join(', ')}'),
                if (game.differenceCounts != null)
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Nombre de différences trouvées:',
                          style: TextStyle(fontWeight: FontWeight.bold)),
                      ...game.playersId.map((uid) {
                        final diffCount =
                            profileConfigService.getDifferenceCountForUid(
                                game.differenceCounts!, uid);
                        final usernameIndex = game.playersId.indexOf(uid);
                        final username = game.playersUsername[usernameIndex];
                        return Text('$username: $diffCount');
                      }).toList(),
                    ],
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget buildProfileSettingsPage() {
    return GestureDetector(
      onTap: () {
        FocusScope.of(context).unfocus();
      },
      child: Scaffold(
        backgroundColor: const Color.fromARGB(255, 43, 41, 41),
        body: SingleChildScrollView(
          child: Column(
            children: <Widget>[
              // ListTile(
              //     title: Text('Language'.tr),
              //     titleTextStyle: const TextStyle(
              //         fontSize: 20.0,
              //         color: Colors.grey,
              //         fontWeight: FontWeight.bold),
              //     trailing: ButtonTheme(
              //         child: Row(
              //       mainAxisSize: MainAxisSize.min,
              //       children: <Widget>[
              //         ElevatedButton(
              //           style: ElevatedButton.styleFrom(
              //             textStyle: const TextStyle(fontSize: 20),
              //             backgroundColor:
              //                 _isEnglish == 'En' ? Colors.purple : Colors.grey,
              //           ),
              //           child: const Text('EN',
              //               style: TextStyle(color: Colors.white)),
              //           onPressed: () => _toggleLanguage('En'),
              //         ),
              //         const SizedBox(width: 8.0),
              //         ElevatedButton(
              //           style: ElevatedButton.styleFrom(
              //             textStyle: const TextStyle(fontSize: 20),
              //             backgroundColor:
              //                 _isEnglish == 'Fr' ? Colors.purple : Colors.grey,
              //           ),
              //           child: const Text('FR',
              //               style: TextStyle(color: Colors.white)),
              //           onPressed: () => _toggleLanguage('Fr'),
              //         ),
              //       ],
              //     ))),
              // ListTile(
              //     title: Text('Theme'.tr),
              //     titleTextStyle: const TextStyle(
              //         fontSize: 20.0,
              //         color: Colors.grey,
              //         fontWeight: FontWeight.bold),
              //     trailing: ButtonTheme(
              //       child: Row(
              //         mainAxisSize: MainAxisSize.min,
              //         children: <Widget>[
              //           ElevatedButton(
              //             style: ElevatedButton.styleFrom(
              //               textStyle: const TextStyle(fontSize: 20),
              //               backgroundColor: _themePreference == 'light'
              //                   ? Colors.purple
              //                   : Colors.grey,
              //             ),
              //             child: Text('Clair'.tr,
              //                 style: const TextStyle(color: Colors.white)),
              //             onPressed: () => _toggleTheme('light'),
              //           ),
              //           const SizedBox(width: 8.0),
              //           ElevatedButton(
              //             style: ElevatedButton.styleFrom(
              //               textStyle: const TextStyle(fontSize: 20),
              //               backgroundColor: _themePreference == 'dark'
              //                   ? Colors.purple
              //                   : Colors.grey,
              //             ),
              //             child: Text('Sombre'.tr,
              //                 style: const TextStyle(color: Colors.white)),
              //             onPressed: () => _toggleTheme('dark'),
              //           ),
              //         ],
              //       ),
              //     )),
              // const Divider(),
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: <Widget>[
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          Text("Nom d'utilisateur :".tr,
                              style: const TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.grey)),
                          Text(user.username,
                              style: const TextStyle(
                                  fontSize: 16, color: Colors.grey)),
                        ],
                      ),
                    ),
                    const SizedBox(width: 20),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          Text('Courriel : '.tr,
                              style: const TextStyle(
                                  fontSize: 20,
                                  color: Colors.grey,
                                  fontWeight: FontWeight.bold)),
                          Text(user.email,
                              style: const TextStyle(
                                  fontSize: 16, color: Colors.grey)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const Divider(),
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Form(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Changer le nom d\'utilisateur'.tr,
                          style: const TextStyle(
                              fontSize: 20,
                              color: Colors.grey,
                              fontWeight: FontWeight.bold)),
                      Container(
                        alignment: Alignment.centerLeft,
                        width: MediaQuery.of(context).size.width * 0.5,
                        child: TextFormField(
                          controller: _usernameController,
                          decoration: InputDecoration(
                            labelText: 'Nouveau nom d\'utilisateur'.tr,
                            labelStyle: const TextStyle(color: Colors.white),
                            suffixIcon: IconButton(
                              icon: const Icon(
                                Icons.check,
                                size: 20,
                              ),
                              onPressed: () async {
                                submitNewUsername();
                                FocusScope.of(context).unfocus();
                              },
                            ),
                            fillColor: const Color.fromARGB(255, 138, 130, 130),
                            filled: true,
                            contentPadding: const EdgeInsets.symmetric(
                                vertical: 8.0, horizontal: 8.0),
                          ),
                          style: const TextStyle(
                              color: Colors.black, fontSize: 20),
                          textAlign: TextAlign.left,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const Divider(),
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Mon Avatar (128x128)'.tr,
                            style: const TextStyle(
                                fontSize: 20,
                                color: Colors.grey,
                                fontWeight: FontWeight.bold)),
                        const SizedBox(height: 10),
                        isLoading
                            ? const CircularProgressIndicator()
                            : ClipOval(
                                child: (avatarUrl.contains(',')
                                    ? Image.memory(
                                        base64Decode(avatarUrl.split(',')[1]),
                                        width: 128,
                                        height: 128,
                                        fit: BoxFit.cover,
                                      )
                                    : (avatarUrl.isNotEmpty
                                        ? Image.memory(
                                            base64Decode(avatarUrl),
                                            width: 128,
                                            height: 128,
                                            fit: BoxFit.cover,
                                          )
                                        : Container(
                                            width: 128,
                                            height: 128,
                                            color: Colors.grey,
                                          ))),
                              ),
                      ],
                    ),
                    const SizedBox(width: 20),
                    Expanded(
                        child: Padding(
                      padding: const EdgeInsets.only(left: 90, top: 10),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Choisissez votre avatar ici'.tr,
                              style: const TextStyle(
                                  fontSize: 16,
                                  color: Colors.grey,
                                  fontWeight: FontWeight.bold)),
                          const SizedBox(height: 10),
                          SingleChildScrollView(
                            scrollDirection: Axis.horizontal,
                            child: Row(
                              children: List.generate(
                                profileConfigService.defaultAvatars.length,
                                (index) {
                                  return GestureDetector(
                                    onTap: () async {
                                      setState(() {
                                        avatarPath = profileConfigService
                                            .defaultAvatars[index];
                                      });
                                      submitAvatar();
                                    },
                                    child: Container(
                                      margin: const EdgeInsets.symmetric(
                                          horizontal: 8.0),
                                      child: Image.asset(
                                        profileConfigService
                                            .defaultAvatars[index],
                                        width: 64,
                                        height: 64,
                                        fit: BoxFit.cover,
                                      ),
                                    ),
                                  );
                                },
                              ),
                            ),
                          ),
                          const SizedBox(height: 10),
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              foregroundColor: Colors.white,
                              backgroundColor: Colors.purple,
                            ),
                            onPressed: () async {
                              _pickImage();
                            },
                            child: Text('Capturer une photo'.tr),
                          ),
                        ],
                      ),
                    )),
                  ],
                ),
              ),
              const Divider(),
              Text('Mes sons'.tr,
                  style: const TextStyle(
                      fontSize: 20,
                      color: Colors.grey,
                      fontWeight: FontWeight.bold)),
              const SizedBox(height: 10),
              // Row(
              //   mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              //   children: [
              //     buildSoundButton(1, 'Error Sound'),
              //     buildSoundButton(2, 'Error Sound'),
              //     buildSoundButton(3, 'Error Sound'),
              //   ],
              // ),
              // const SizedBox(height: 10),
              // Row(
              //   mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              //   children: [
              //     buildSoundButton(1, 'Difference Sound'),
              //     buildSoundButton(2, 'Difference Sound'),
              //     buildSoundButton(3, 'Difference Sound'),
              //   ],
              // ),
              buildSoundSection('Error Sound', 3),
              const SizedBox(height: 20),
              buildSoundSection('Difference Sound', 3),
              const SizedBox(height: 10),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  primary: Colors.purple,
                ),
                child: isRecording
                    ? const Text('Stop Recording',
                        style: TextStyle(color: Colors.white))
                    : const Text('Start Recording',
                        style: TextStyle(color: Colors.white)),
                onPressed: () async {
                  if (recorder.isRecording) {
                    await stop();
                  } else {
                    await record();
                  }
                  setState(() {});
                },
              ),
              if (audioPath.isNotEmpty)
                ElevatedButton(
                  child: const Text('Add this sound to my list'),
                  onPressed: () {
                    setState(() {
                      recordedSounds.add(audioPath);
                    });
                  },
                ),
              // New section to display My Recorded Sounds
              if (recordedSounds.isNotEmpty)
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 20),
                    Text(
                      'My Recorded Sounds',
                      style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.grey),
                    ),
                    const SizedBox(height: 10),
                    // Buttons to play each recorded sound
                    for (int i = 0; i < recordedSounds.length; i++)
                      ElevatedButton(
                        child: Text('Play Recorded Sound $i'),
                        onPressed: () {
                          audioPlayer.stop();
                          playRecording(recordedSounds[i]);
                        },
                      ),
                  ],
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget buildSoundSection(String soundType, int count) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0),
          child: Text(
            soundType,
            style: const TextStyle(
                fontSize: 20, fontWeight: FontWeight.bold, color: Colors.grey),
          ),
        ),
        Wrap(
          spacing: 10, // Horizontal space between buttons
          runSpacing: 10, // Vertical space between lines
          children: List.generate(count, (index) {
            return buildSoundButton(index + 1, soundType);
          }),
        ),
      ],
    );
  }

  Widget buildSoundButton(int buttonNumber, String soundType) {
    String audioAsset;

    if (soundType == 'Error Sound') {
      audioAsset = 'audio/errorSound$buttonNumber.wav';
    } else if (soundType == 'Difference Sound') {
      audioAsset = 'audio/differenceFoundSound$buttonNumber.wav';
    } else {
      audioAsset = '';
    }

    bool isSelected =
        (soundType == 'Error Sound' && selectedErrorSound == buttonNumber) ||
            (soundType == 'Difference Sound' &&
                selectedDifferenceSound == buttonNumber);

    return ElevatedButton(
      style: ElevatedButton.styleFrom(
        primary: isSelected ? Colors.purple : Colors.grey,
      ),
      onPressed: () {
        setState(() {
          if (soundType == 'Error Sound') {
            selectedErrorSound = buttonNumber;
            ErrorSoundSingleton().selectedErrorPath = audioAsset;
          } else if (soundType == 'Difference Sound') {
            selectedDifferenceSound = buttonNumber;
            DifSoundSingleton().selectedDifPath = audioAsset;
          }
        });
        playAudio(audioAsset);
      },
      child: Text(soundType, style: const TextStyle(color: Colors.white)),
    );
  }

  playAudio(String audioAsset) {
    stop();
    audioPlayer.stop();
    audioPlayer.play(AssetSource(audioAsset));
  }
}

class TimelineTile extends StatelessWidget {
  final Map<String, dynamic> connection;
  final DateFormat dateFormat;

  const TimelineTile(
      {Key? key, required this.connection, required this.dateFormat})
      : super(key: key);

  @override
  Widget build(BuildContext context) {
    bool isConnected = connection.containsKey('connectedAt');
    DateTime dateTime = DateTime.parse(isConnected
            ? connection['connectedAt']
            : connection['disconnectedAt'])
        .toLocal();
    String formattedDate = dateFormat.format(dateTime);

    return ListTile(
      leading: Icon(
        isConnected ? Icons.login : Icons.logout,
        color: isConnected ? Colors.green : Colors.red,
      ),
      title: Text(isConnected ? 'Connexion' : 'Déconnexion',
          style: const TextStyle(
              fontWeight: FontWeight.bold, color: Colors.white)),
      subtitle:
          Text(formattedDate, style: const TextStyle(color: Colors.white)),
      trailing: const Icon(Icons.access_time),
    );
  }
}
