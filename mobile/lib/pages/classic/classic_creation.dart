import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:mobile/classes/game.dart';
import 'package:mobile/constants/constants.dart' as constants;
import 'package:mobile/services/authentication.dart';
import 'package:mobile/services/communication_service.dart';
import 'package:mobile/widgets/cards/game_card.dart';
import 'package:mobile/widgets/custom_scaffold.dart';

class ClassicCreation extends StatefulWidget {
  @override
  _ClassicCreationState createState() => _ClassicCreationState();
}

class _ClassicCreationState extends State<ClassicCreation> {
  List<Game> games = [];
  final CommunicationService commService = Get.find<CommunicationService>();

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  @override
  void dispose() {
    super.dispose();
  }

  Future<void> _fetchData() async {
    final AuthenticationService authService = Get.find<AuthenticationService>();
    final token = await authService.getToken();

    if (token == null) {
      return;
    }

    final response = await http.get(
        Uri.parse('${constants.serverPath}/api/cards'),
        headers: {'Authorization': 'Bearer $token'});

    List<dynamic> rawGameInfo = jsonDecode(response.body);

    for (var gameInfo in rawGameInfo) {
      games.add(Game(
          cardId: gameInfo['id'],
          imageUrl: await commService.getMiniatureById(gameInfo['id']),
          name: gameInfo['name'],
          diffCount: gameInfo['diffCount'],
          difficulty: gameInfo['difficulty'] == 'Facile'
              ? Difficulty.facile
              : Difficulty.difficile,
          rating: double.tryParse(gameInfo['rating'].toString()),
          numberOfRatings:
              int.tryParse(gameInfo['numberOfRatings'].toString())));
    }

    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return CustomScaffold(
        automaticallyImplyLeading: true,
        body: Container(
          color: const Color.fromARGB(255, 28, 26, 29),
          child: ListView(
            children: [
              // The title
              const Padding(
                padding: EdgeInsets.all(16.0),
                child: Text(
                  "Sélectionnez votre jeu",
                  style: TextStyle(
                    fontSize: 24.0,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),

              // The sort button
              Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color.fromARGB(255, 194, 43, 181),
                  ),
                  onPressed: () {
                    setState(() {
                      sortGames(); // This is the function that sorts your games
                    });
                  },
                  child: const Text(
                    'Trier les jeux en fonction de leurs notes',
                    style: TextStyle(color: Colors.white),
                  ),
                ),
              ),

              // The games list
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: games.length,
                itemBuilder: (BuildContext context, int index) {
                  return GameCard(game: games[index]);
                },
              ),
            ],
          ),
        ));
  }

  void sortGames() {
    if (games.isEmpty) return;
    games.sort((a, b) {
      // Handle the case where both ratings are null
      if (a.rating == null && b.rating == null) {
        return 0; // Consider them equal in terms of sorting
      }

      // Handle the case where only one rating is null
      if (a.rating == null) return 1; // a should be ordered after b
      if (b.rating == null) return -1; // b should be ordered after a

      // If both ratings are non-null, compare them directly
      return b.rating!.compareTo(a.rating!);
    });
  }
}
