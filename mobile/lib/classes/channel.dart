import 'package:get/get.dart';

class JoinableChannel {
  final String channelName;
  RxBool unread = false.obs;

  JoinableChannel({required this.channelName});
}
