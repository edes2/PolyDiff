import re
from datetime import datetime
import json

import pytz
from config.database import Collections
from database_service import DatabaseService
from models.chats import Message
from user_service import UserService

def load_censored_words(file_path: str, language: str):
    """
    Load censored words from a JSON file.
    """
    with open(file_path, 'r', encoding='utf-8') as file:
            all_censored_words = json.load(file)
            return all_censored_words.get(language, [])
    
class MessageService:
    __montreal_tz = pytz.timezone('America/Montreal')
    GLOBALCHATS = "GlobalChats"
    GENERALCHAT = "GeneralChat"
    PRIVATECHATS = "PrivateChats"
    usersPerChannel = {}
    censored_words = []
    censored_words.extend(load_censored_words('./18and+words/build.json', 'fr'))
    censored_words.extend(load_censored_words('./18and+words/build.json', 'en'))


    @classmethod
    @property
    def db(cls):
        """
        Returns the database where the messages are stored.
        """
        return DatabaseService.db_chat

    @staticmethod
    def enrich_messages_username(messages):
        """
        Enriches the messages with the username of the emitter.
        Can throw an exception if the user does not exist.
        """
        for message in messages:
            MessageService.enrich_message_username(message)

    @staticmethod
    def enrich_message_username(message):
        """
        Enriches the message with the username of the emitter.
        Can throw an exception if the user does not exist.
        """
        uid = message['emitterId']
        username = UserService.get_username_by_id(uid)

        if not username:
            raise Exception(f"User with id {uid} does not exist")

        message['emitterName'] = username

    @classmethod
    def add_user_channel(cls, userId, channelId):
        if not MessageService.usersPerChannel or not userId in MessageService.usersPerChannel:
            MessageService.usersPerChannel[userId] = [channelId]
        else:
            MessageService.usersPerChannel[userId].append(channelId)

    @classmethod
    def remove_user_channel(cls, userId, channelId):
        try:
            MessageService.usersPerChannel[userId].remove(channelId)
        except:
            print("Channel is not in the user's list")

    @classmethod
    def enrich_message_timestamp(cls, message):
        """
        Enriches the message with the current timestamp.
        """
        message['timestamp'] = cls.__get_current_timestamp()

    @classmethod
    def get_global_chat(cls, chatId: str):
        chat_collection = cls.db[cls.GLOBALCHATS]
        return chat_collection.find_one({"channelId": chatId})

    @classmethod
    def get_private_chat(cls, chatId: str):
        chat_collection = cls.db[cls.PRIVATECHATS]
        return chat_collection.find_one({"channelId": chatId})

    @classmethod
    def get_general_chat(cls):
        chat_collection = cls.db[cls.GENERALCHAT]
        return chat_collection.find_one({"channelId": 'General'})

    @classmethod
    def get_joined_channels(cls, userId: str):
        if (userId in MessageService.usersPerChannel):
            print('1')
            return MessageService.usersPerChannel[userId]
        else:
            print('2')
            return []

    @classmethod
    def get_all_global_channels_names(cls):
        return cls.db[cls.GLOBALCHATS].distinct("channelId")

    @classmethod
    def delete_a_global_channel(cls, channelId: str):
        cls.db[cls.GLOBALCHATS].delete_one({"channelId": channelId})

    @classmethod
    def delete_a_private_channel(cls, channelId: str):
        cls.db[cls.PRIVATECHATS].delete_one({"channelId": channelId})

    @classmethod
    def create_new_global_chat(cls, channelId: str):
        if (channelId.startswith('PrivateChat: ')):
            print("Channel ID cannot start with 'Private'.")
            return False
        if not verify_whitespaces(channelId):
            print("Channel ID cannot contain spaces.")
            return False
        if cls.db[cls.GLOBALCHATS].find_one({"channelId": channelId}):
            print("Channel ID already exists in the database.")
            return False
        try:
            cls.db[cls.GLOBALCHATS].insert_one(
                {"channelId": channelId, "messages": []})
        except:
            print("Erreur de creation de collection (probablement le meme nom)")
            return False
        return True

    @classmethod
    def create_new_private_chat(cls, channelId: str):
        try:
            cls.db[cls.PRIVATECHATS].insert_one(
                {"channelId": channelId, "messages": []})
        except:
            print("Erreur de creation de collection (probablement le meme nom)")
            return False
        return True

    @classmethod
    def insert_into_global_chat(cls, channelId: str, msg: Message):
        """
        Inserts the message in the global chat specified.
        """
        cls.db[cls.GLOBALCHATS].update_one(
            {"channelId": channelId},
            {"$push": {"messages": dict(msg)}},
            upsert=True
        )

    @classmethod
    def insert_into_private_chat(cls, channelId: str, msg: Message):
        """
        Inserts the message in the global chat specified.
        """
        cls.db[cls.PRIVATECHATS].update_one(
            {"channelId": channelId},
            {"$push": {"messages": dict(msg)}},
            upsert=True
        )

    @classmethod
    def insert_into_general_chat(cls, msg: Message):
        """
        Inserts the message in the global chat specified.
        """
        cls.db[cls.GENERALCHAT].update_one(
            {"channelId": 'General'},
            {"$push": {"messages": dict(msg)}},
            upsert=True
        )
    
    @classmethod
    def censor_message(cls, phrase: str):
        if not isinstance(phrase, str):
            raise ValueError("Input must be a string")
        for word in cls.censored_words:
            pattern = r'\b' + re.escape(word) + r'\b'
            replacement = '*' * len(word)
            phrase = re.sub(pattern, replacement, phrase, flags=re.IGNORECASE)
        return phrase

    @staticmethod
    def __get_current_timestamp():
        """
        Returns the current timestamp in the format 'YYYY-MM-DD HH:MM:SS'.
        """
        return datetime.now(MessageService.__montreal_tz).strftime('%Y-%m-%d %H:%M:%S')


try:
    MessageService.db.create_collection(MessageService.GENERALCHAT)
    MessageService.db[MessageService.GENERALCHAT].insert_one(
        {"channelId": 'General', "messages": []})
except:
    print('General chat already exists')
try:
    MessageService.db.create_collection(MessageService.PRIVATECHATS)
except:
    print('Private chats already exists')
try:
    MessageService.db.create_collection(MessageService.GLOBALCHATS)
except:
    print('Global chats already exists')


def verify_whitespaces(input_text: str) -> bool:
    # Regular expression for invisible characters
    invisible_chars_regexp = r'[\x00-\x1F\x7F-\x9F\u200B-\u200F\u2028-\u202E]'

    # Check for invisible characters
    has_invisible_chars = re.search(
        invisible_chars_regexp, input_text) is not None

    # Check for any whitespace characters
    has_whitespace = re.search(r'\s', input_text) is not None

    # Return True if no invisible or whitespace characters are found
    return not (has_invisible_chars or has_whitespace)


