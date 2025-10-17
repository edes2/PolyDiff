// ignore_for_file: constant_identifier_names

import 'package:flutter/material.dart';

const String title = 'Erratum';
const Color backgroundColor = Color.fromARGB(255, 25, 24, 25);
const String logoPath = 'assets/images/nemo.png';

//530x398
double scaleX = 530 / 640;
double scaleY = 398 / 480;

double productionTabletteHeight = 800;
double productionTabletteWidth = 1280;

double gameCanvasHeight = 420;
double gameCanvasWidth = 560;

const production = true;

const isEmulator =
    false; // Si on est sur l'emulator de Android Studio et en production=false, mettre à true

String get fastApiPath => production
    ? 'http://ec2-15-222-243-115.ca-central-1.compute.amazonaws.com:8000'
    : (isEmulator ? 'http://10.0.2.2:8000' : 'http://localhost:8000');

String get serverPath => production
    ? 'http://ec2-99-79-73-87.ca-central-1.compute.amazonaws.com:3000'
    : (isEmulator ? 'http://10.0.2.2:3000' : 'http://localhost:3000');
