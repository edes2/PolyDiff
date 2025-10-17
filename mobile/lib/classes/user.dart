class UserProfile {
  final String uid;
  final String email;
  String username;
  String? languagePreference;
  String? themePreference;

  UserProfile({
    required this.uid,
    required this.email,
    required this.username,
    this.languagePreference,
    this.themePreference,
  });

  static fromJson(p) {
    return UserProfile(
      uid: p['uid'],
      email: p['email'],
      username: p['username'],
      languagePreference: p['languagePreference'],
      themePreference: p['themePreference'],
    );
  }

  @override
  String toString() {
    return 'UserProfile(uid: $uid, email: $email, username: $username, languagePreference: $languagePreference, themePreference: $themePreference)';
  }
}
