import socketio


class VoiceChatService:
    rooms: dict[str, set[str]] = {}  # Stores room_id: set(peer_id)
    socket_id_to_peer_id: dict[str, str] = {}  # Stores socket.id: peer.id

    @classmethod
    async def join_room(cls, sio: socketio.AsyncServer, sid, room_id, peer_id):
        if room_id not in cls.rooms:
            cls.rooms[room_id] = set()

        cls.rooms[room_id].add(peer_id)

        # Store the socket.id-to-peer.id mapping
        cls.socket_id_to_peer_id[sid] = peer_id

        # Notify other users in the room about the new participant
        await sio.emit('newVoicePeer', peer_id, room=room_id)

        # Join the Socket.IO room
        sio.enter_room(sid, room=room_id)

    @classmethod
    async def leave_room(cls, sio: socketio.AsyncServer, sid):
        peer_id = cls.socket_id_to_peer_id.get(sid, None)

        if (peer_id is None):
            return

        del cls.socket_id_to_peer_id[sid]

        room_id = cls.find_room(peer_id)

        if room_id is None:
            return

        if room_id in cls.rooms and peer_id in cls.rooms[room_id]:
            cls.rooms[room_id].remove(peer_id)

            if not cls.rooms[room_id]:  # If room is empty, delete it
                print(f"Room {room_id} is empty, deleting")
                del cls.rooms[room_id]

            # Notify other users in the room that the participant has left
            await sio.emit('voicePeerLeft', {'peer_id': peer_id}, room=room_id)

            # Leave the Socket.IO room
            sio.leave_room(sid, room=room_id)

            print(f"Peer {peer_id} left room {room_id}")

    @classmethod
    def get_peers(cls, sio: socketio.AsyncServer, room_id):
        return list(cls.rooms[room_id]) if room_id in cls.rooms else []

    @classmethod
    def find_room(cls, peer_id):
        for r_id, peers in cls.rooms.items():
            if peer_id in peers:
                return r_id
        return None
