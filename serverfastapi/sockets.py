import socketio
from message_service import MessageService
from voice_chat import VoiceChatService

sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")
sio_app = socketio.ASGIApp(sio, socketio_path='/')


@sio.on('joinVoiceChat')
async def join_voice_chat(sid, data):
    room_id, peer_id = data['roomId'], data['peerId']
    print(f"Peer {peer_id} wants to join room {room_id}")
    await VoiceChatService.join_room(sio, sid, room_id, peer_id)


@sio.on('leaveVoiceChat')
async def leave_voice_chat(sid, data):
    room_id, peer_id = data['roomId'], data['peerId']
    await VoiceChatService.leave_room(sio, sid)


@sio.on('joinNewChannel')
async def joinNewChannel(sid, data):
    MessageService.add_user_channel(data['userId'], data['channelId'])
    sio.enter_room(sid, room=data['channelId'])


@sio.on('joinChannel')
async def joinChannel(sid, data):
    sio.enter_room(sid, room=data['channelId'])


@sio.on('newChat')
async def createNewChat(sid, channelId):
    # if MessageService.create_global_chat(channelId) == True:
    if MessageService.create_new_global_chat(channelId) == True:
        await sio.emit('channel_created', channelId)
    else:
        return


@sio.on('deleteChannel')
async def deleteChannel(sid, data):
    channelId = str(data['channelId'])
    if channelId.startswith('PrivateChat: '):
        MessageService.delete_a_private_channel(data['channelId'])
    else:
        MessageService.delete_a_global_channel(data['channelId'])
    await sio.emit('deleted_channel', data['channelId'])


@sio.on('leaveChannel')
async def leaveChannel(sid, data):
    MessageService.remove_user_channel(data['userId'], data['channelId'])
    sio.leave_room(sid, room=data['channelId'])


@sio.on('send_message')
async def handle_message(sid, data):
    chatId = str(data['chatId'])
    try:
        MessageService.enrich_message_timestamp(data['message'])
        censored_message = MessageService.censor_message(
            data['message']['content'])
        data['message']['content'] = censored_message
        if chatId == 'General':
            MessageService.insert_into_general_chat(msg=data['message'])
        elif chatId.startswith('PrivateChat: '):
            MessageService.insert_into_private_chat(
                channelId=data['chatId'], msg=data['message'])
        else:
            MessageService.insert_into_global_chat(
                channelId=data['chatId'], msg=data['message'])
        MessageService.enrich_message_username(data['message'])
        await sio.emit('receive_message', data, room=data['chatId'])
        await sio.emit('receive_notification', data['chatId'], room=data['chatId'], skip_sid=sid)
    except Exception as e:
        print(f"Error while handling message: {e}")


@sio.on('disconnect')
async def disconnect(sid):
    print('Client disconnected', sid)
    await VoiceChatService.leave_room(sio, sid)
