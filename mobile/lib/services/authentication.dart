import 'dart:convert';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:mobile/classes/user.dart';
import 'package:mobile/constants/constants.dart' as constants;

class AuthenticationService extends GetxService {
  final firebase = FirebaseAuth.instance;

  static AuthenticationService get to => Get.find();

  Future<bool> signUp(String email, String password, String username) async {
    try {
      final response = await http.post(
          Uri.parse('${constants.serverPath}/api/users/signup'),
          body: {'username': username, 'email': email, 'password': password});

      if (response.statusCode != 200) {
        throw Exception('Failed to create account');
      }
      await signIn(email, password);
      return true;
    } catch (e) {
      print(e);
      return false;
    }
  }

  Future<bool> signIn(String email, String password) async {
    try {
      await firebase.signInWithEmailAndPassword(
        email: email,
        password: password,
      );
      return true;
    } catch (e) {
      print(e);
      return false;
    }
  }

  Future<String?> getToken() async {
    return firebase.currentUser?.getIdToken();
  }

  Future<UserProfile?> fetchUser() async {
    final token = await getToken();
    if (token == null) return null;

    final response = await http.get(
        Uri.parse('${constants.serverPath}/api/users/profile'),
        headers: {'Authorization': 'Bearer ' + token});

    if (response.statusCode != 200) return null;
    var responseData = jsonDecode(response.body);
    return UserProfile(
        uid: responseData['uid'],
        email: responseData['email'],
        username: responseData['username'],
        languagePreference: responseData['languagePreference'],
        themePreference: responseData['themePreference']);
  }

  Future<void> resetPassword(String email) async {
    await firebase.sendPasswordResetEmail(email: email);
  }
}
