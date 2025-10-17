import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:mobile/classes/user.dart';

class UserProvider extends GetxService with ChangeNotifier {
  UserProfile? _user;
  UserProfile? get user => _user;

  set user(UserProfile? newUser) {
    _user = newUser;
    notifyListeners();
  }
}
