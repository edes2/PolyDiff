import os
from config.database import MONGODB_URL, Development, Production
from config.deployment import ENV, PROD, DEV
from pymongo import MongoClient

class DatabaseService:
    client = MongoClient(MONGODB_URL)

    @classmethod
    @property
    def db(cls):
        """ 
        Returns the main database (having the users, history, etc.) based on the environment.
        If the environment is DEV, then the Development database is returned.
        """
        namespace = Production if cls.__is_prod() else Development
        return cls.client[namespace.MAIN_DB.value]

    @classmethod
    @property
    def db_chat(cls):
        """
        Returns the chat database (having the global chat, private chats, etc.) based on the environment.
        If the environment is DEV, then the Development database is returned.
        """
        namespace = Production if cls.__is_prod() else Development
        return cls.client[namespace.CHAT_DB.value]

    @staticmethod
    def __is_prod():
        """
        Returns True if the environment is PROD, False otherwise.
        """

        return os.environ.get(ENV, DEV) == PROD
