from config.database import Collections
from database_service import DatabaseService


class UserService:

    @classmethod
    @property
    def collection(cls):
        """
        Returns the database where the users are stored.
        """
        return DatabaseService.db[Collections.USERS.value]

    @classmethod
    def get_user_by_id(cls, uid):
        """
        Returns the user with the given id.
        Return None if the user does not exist.
        """
        return cls.collection.find_one({'uid': uid})

    @classmethod
    def get_username_by_id(cls, uid):
        """
        Returns the username of the user with the given id.
        Return None if the user does not exist.
        """
        user = cls.get_user_by_id(uid)
        return user['username'] if user else None
