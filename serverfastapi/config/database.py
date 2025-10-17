from enum import Enum

# from models.chats import Chat

MONGODB_URL = 'MONGODB_URL'


class Production(Enum):
    MAIN_DB = 'DB_LOG3900'
    CHAT_DB = 'DB_LOG3900_CHAT'


class Development(Enum):
    MAIN_DB = 'DB_LOG3900_dev'
    CHAT_DB = 'DB_LOG3900_CHAT_dev'


class Collections(Enum):
    GLOBAL_CHAT = 'globalChat'
    USERS = 'users'
