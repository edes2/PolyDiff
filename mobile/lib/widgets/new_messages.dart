// ignore_for_file: use_build_context_synchronously

import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:image/image.dart' as img;
import 'package:image_picker/image_picker.dart';
import 'package:mobile/classes/user.dart';
import 'package:mobile/services/authentication.dart';
import 'package:mobile/services/chat_service.dart';
import 'package:mobile/widgets/custom_snackbar.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;

class NewMessage extends StatefulWidget {
  final IO.Socket socket;
  final Function scrollToBottom;

  NewMessage({super.key, required this.socket, required this.scrollToBottom});

  @override
  State<NewMessage> createState() => NewMessageState();
}

class NewMessageState extends State<NewMessage> {
  final chatService = Get.find<ChatService>();
  var messageController = TextEditingController();
  var gifController = TextEditingController();
  FocusNode messageFocusNode = FocusNode();
  List<String> gifUrls = [];
  String searchQuery = '';
  late UserProfile user =
      UserProfile(uid: '1', username: 'Lorem', email: 'lorem@ipsum.com');

  RxBool isCustomSnackbarVisible = false.obs;
  RxBool canSendMessages = true.obs;

  @override
  void initState() {
    super.initState();
    fetchUser();
  }

  void fetchUser() async {
    AuthenticationService authService = Get.find<AuthenticationService>();
    UserProfile? fetchedUser = await authService.fetchUser();
    if (fetchedUser != null) {
      user = fetchedUser;
    }
  }

  Future<void> pickAndSendImage(BuildContext context) async {
    if (canSendMessages.value) {
      final ImagePicker imagePicker = ImagePicker();
      final XFile? pickedImage =
          await imagePicker.pickImage(source: ImageSource.camera);

      if (pickedImage != null) {
        final imageFile = File(pickedImage.path);
        final bytes = await imageFile.readAsBytes();
        img.Image? image = img.decodeImage(bytes);
        img.Image resizedImage =
            img.copyResize(image!, width: 128, height: 128);
        List<int> pngBytes = img.encodePng(resizedImage);
        final base64Image = base64Encode(pngBytes);
        final imageUrl = 'data:image/png;base64,$base64Image';
        chatService.sendMessage(imageUrl, user.uid, 'image');
        widget.scrollToBottom();

        canSendMessages.value = false;

        Timer(const Duration(seconds: 2), () {
          canSendMessages.value = true;
        });
        messageFocusNode.requestFocus();
      }
    } else {
      showCustomSnackBar();
    }
  }

  @override
  void dispose() {
    messageController.dispose();
    gifController.dispose();
    super.dispose();
  }

  void submitMessage() {
    if (canSendMessages.value) {
      String userMessage = messageController.text;

      final RegExp invisibleCharsRegExp =
          RegExp(r'[\x00-\x1F\x7F-\x9F\u200B-\u200F\u2028-\u202E]');

      if (userMessage.trim().isEmpty ||
          userMessage.length > 200 ||
          invisibleCharsRegExp.hasMatch(userMessage)) {
        messageController.clear();
        return;
      }

      List<String> words = userMessage.split(' ');
      for (int i = 0; i < words.length; i++) {
        words[i] = processAndCensorWord(words[i]);
      }
      userMessage = words.join(' ');

      chatService.sendMessage(userMessage, user.uid, 'text');
      messageController.clear();
      Future.delayed(Duration.zero, () {
        widget.scrollToBottom();
      });
      canSendMessages.value = false;
      Timer(const Duration(seconds: 2), () {
        canSendMessages.value = true;
      });
      FocusScope.of(context).requestFocus(FocusNode());
      messageFocusNode.requestFocus();
    } else {
      showCustomSnackBar();
    }
  }

  String processAndCensorWord(String word) {
    String processedWord = '';
    for (int i = 0; i < word.length; i++) {
      if (i == 0 || word[i].toLowerCase() != word[i - 1].toLowerCase()) {
        processedWord += word[i];
      }
    }
    if (chatService.bannedWords.contains(processedWord.toLowerCase())) {
      return '*****'; // Replace with asterisks
    }
    return word;
  }

  void showCustomSnackBar({Duration duration = const Duration(seconds: 10)}) {
    isCustomSnackbarVisible.value = true;

    Timer(const Duration(seconds: 10), () {
      isCustomSnackbarVisible.value = false;
    });
  }

  void showGifSearch() async {
    if (canSendMessages.value) {
      gifController.clear();
      await showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        builder: (BuildContext context) {
          return Padding(
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(context).viewInsets.bottom,
            ),
            child: StatefulBuilder(
              builder: (BuildContext context, StateSetter setModalState) {
                return SizedBox(
                  height: MediaQuery.of(context).size.height * 0.4,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Padding(
                        padding: const EdgeInsets.all(8.0),
                        child: TextField(
                          decoration: InputDecoration(
                            labelText: 'Chercher des GIFs',
                            suffixIcon: IconButton(
                              icon: const Icon(Icons.search),
                              onPressed: () async {
                                searchQuery = gifController.text;
                                if (searchQuery.trim().isEmpty) {
                                  return;
                                }
                                try {
                                  final gifs =
                                      await chatService.searchGifs(searchQuery);
                                  setModalState(() {
                                    gifUrls = gifs;
                                  });
                                } catch (e) {
                                  print(e);
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                        content: Text('Erreur de chargement des GIFs')),
                                  );
                                }
                              },
                            ),
                          ),
                          controller: gifController,
                          onSubmitted: (String value) async {
                            if (value.trim().isEmpty) {
                              return;
                            }
                            try {
                              final gifs = await chatService.searchGifs(value);
                              setModalState(() {
                                gifUrls = gifs;
                              });
                            } catch (e) {
                              print(e);
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                    content: Text('Erreur de chargement des GIFs')),
                              );
                            }
                          },
                        ),
                      ),
                      Expanded(
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          itemCount: gifUrls.length,
                          itemBuilder: (BuildContext context, int index) {
                            return GestureDetector(
                              onTap: () {
                                chatService.sendMessage(
                                    gifUrls[index], user.uid, 'gif');
                                canSendMessages.value = false;
                                Timer(const Duration(seconds: 2), () {
                                  canSendMessages.value = true;
                                });
                                Navigator.pop(context);
                              },
                              child: Padding(
                                padding: const EdgeInsets.all(4.0),
                                child: Image.network(
                                  gifUrls[index],
                                  height: 25,
                                  width: 150,
                                  fit: BoxFit.cover,
                                  headers: const {'Content-Type': 'image/gif'},
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          );
        },
      );
    } else {
      messageFocusNode.requestFocus();
      showCustomSnackBar();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 15, right: 1, bottom: 14),
      child: isCustomSnackbarVisible.value
          ? CustomSnackBar(
              message:
                  'Vous devez attendre 2 secondes entre chaque message!'.tr,
              isVisible: isCustomSnackbarVisible.value,
            )
          : Row(
              children: [
                IconButton(
                  color: Theme.of(context).colorScheme.primary,
                  icon: const Icon(
                    Icons.gif,
                  ),
                  onPressed: showGifSearch,
                ),
                IconButton(
                  color: Theme.of(context).colorScheme.primary,
                  icon: const Icon(Icons.camera_alt),
                  onPressed: () => pickAndSendImage(context),
                ),
                Expanded(
                  child: TextField(
                    controller: messageController,
                    focusNode: messageFocusNode,
                    textCapitalization: TextCapitalization.sentences,
                    autocorrect: true,
                    enableSuggestions: true,
                    keyboardType: TextInputType.text,
                    textInputAction: TextInputAction.send,
                    decoration: InputDecoration(
                      labelText: 'Envoyez votre message...'.tr,
                      counterText: '',
                    ),
                    maxLength: 200,
                    onSubmitted: (text) {
                      submitMessage();
                    },
                  ),
                ),
                IconButton(
                  color: Theme.of(context).colorScheme.primary,
                  icon: const Icon(
                    Icons.send,
                  ),
                  onPressed: submitMessage,
                ),
              ],
            ),
    );
  }
}
