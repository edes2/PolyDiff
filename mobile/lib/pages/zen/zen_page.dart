import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:mobile/services/zen_mode.dart';
import 'package:mobile/widgets/custom_scaffold.dart';

class ZenPage extends StatefulWidget {
  const ZenPage({super.key});

  @override
  _ZenPageState createState() => _ZenPageState();
}

class _ZenPageState extends State<ZenPage> {
  final ZenModeService zenModeService = Get.find<ZenModeService>();

  @override
  void initState() {
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return CustomScaffold(
        automaticallyImplyLeading: true,
        backgroundColor: const Color.fromARGB(255, 28, 26, 29),
        body: const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                'Bienvenue au Zen Mode',
                style: TextStyle(
                  fontSize: 24.0,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              Text(
                "C'est le temps de relaxer un peu. Prenez une grande respiration, et commençons.",
                style: TextStyle(
                  fontSize: 18.0,
                  fontStyle: FontStyle.italic,
                  color: Colors.white,
                ),
              ),
              SizedBox(height: 16.0),
              QuoteWidget(),
              SizedBox(height: 105.0),
              Text(
                'Choisissez votre type de musique',
                style: TextStyle(
                  fontSize: 18.0,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              SizedBox(height: 8.0),
              MusicTypeGrid(),
            ],
          ),
        ));
  }
}

class QuoteWidget extends StatelessWidget {
  const QuoteWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return RichText(
      textAlign: TextAlign.center,
      text: TextSpan(
        style: DefaultTextStyle.of(context).style,
        children: const <TextSpan>[
          TextSpan(
            text:
                '"Fermez les yeux, respirez profondément, et imaginez un lieu de paix. Maintenant, ouvrez les yeux, vous êtes toujours devant votre écran." - Confucius',
            style: TextStyle(
              fontStyle: FontStyle.italic,
              fontSize: 18.0,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }
}

class MusicTypeGrid extends StatefulWidget {
  const MusicTypeGrid({super.key});

  @override
  _MusicTypeGridState createState() => _MusicTypeGridState();
}

class _MusicTypeGridState extends State<MusicTypeGrid> {
  // State flags for each button
  String selectedMusicType = '';

  final ZenModeService zenModeService = Get.find<ZenModeService>();

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            ElevatedButton(
              onPressed: () async {
                // await zenModeService.stopAudio();
                // await zenModeService.playLofi();
                await zenModeService.selectAudio('lofi');
                setState(() {
                  selectedMusicType = 'lofi';
                });
              },
              style: ElevatedButton.styleFrom(
                primary:
                    selectedMusicType == 'lofi' ? Colors.purple : Colors.grey,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10.0),
                ),
              ),
              child: const SizedBox(
                width: 150,
                height: 50,
                child: Center(
                  child: Text(
                    'lofi',
                    style: TextStyle(fontSize: 16.0, color: Colors.white),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8.0),
            ElevatedButton(
              onPressed: () async {
                // await zenModeService.stopAudio();
                // await zenModeService.selectClassical();
                await zenModeService.selectAudio('classical');
                setState(() {
                  selectedMusicType = 'classical';
                });
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: selectedMusicType == 'classical'
                    ? Colors.purple
                    : Colors.grey,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10.0),
                ),
              ),
              child: const SizedBox(
                width: 150,
                height: 50,
                child: Center(
                  child: Text(
                    'classical',
                    style: TextStyle(fontSize: 16.0, color: Colors.white),
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8.0),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            ElevatedButton(
              onPressed: () async {
                // await zenModeService.stopAudio();
                // await zenModeService.playJazz();
                await zenModeService.selectAudio('jazz');
                setState(() {
                  selectedMusicType = 'jazz';
                });
              },
              style: ElevatedButton.styleFrom(
                backgroundColor:
                    selectedMusicType == 'jazz' ? Colors.purple : Colors.grey,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10.0),
                ),
              ),
              child: const SizedBox(
                width: 150,
                height: 50,
                child: Center(
                  child: Text(
                    'jazz',
                    style: TextStyle(fontSize: 16.0, color: Colors.white),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8.0),
            ElevatedButton(
              onPressed: () async {
                // await zenModeService.stopAudio();
                // await zenModeService.playNature();
                await zenModeService.selectAudio('nature');
                setState(() {
                  selectedMusicType = 'nature';
                });
              },
              style: ElevatedButton.styleFrom(
                backgroundColor:
                    selectedMusicType == 'nature' ? Colors.purple : Colors.grey,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10.0),
                ),
              ),
              child: const SizedBox(
                width: 150,
                height: 50,
                child: Center(
                  child: Text(
                    'nature',
                    style: TextStyle(fontSize: 16.0, color: Colors.white),
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16.0),
        ElevatedButton(
          onPressed: () {
            if (selectedMusicType.isNotEmpty) {
            Navigator.pushNamed(context, '/zenGamePage');
            }
          },
          style: ElevatedButton.styleFrom(
            foregroundColor: Colors.white,
            backgroundColor: selectedMusicType.isNotEmpty ? Colors.green : Colors.grey,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10.0),
            ),
          ),
          child: const SizedBox(
            width: 150,
            height: 50,
            child: Center(
              child: Text(
                'Commencer',
                style: TextStyle(fontSize: 16.0, color: Colors.white),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
