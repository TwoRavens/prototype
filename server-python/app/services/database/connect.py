"""
Used to connect to a mongo database
"""
import os
from urllib.parse import quote_plus

from pymongo import MongoClient
from pymongo.database import Database
from pymongo.collection import Collection


class MongoClientUtil(object):
    """
    Used for querying mongo
    """

    # share one mongo client among all instances
    _client: MongoClient = None

    def __init__(self):
        if self._client is None:
            self._client = MongoClient(
                self.get_mongo_url(), serverSelectionTimeoutMS=1000
            )

    @staticmethod
    def get_mongo_url():
        """Retrieve/construct the mongo connection string"""

        # Is the full connection string available?
        explicit_str = os.environ.get("MONGO_CONNECTION_STRING")
        if explicit_str:
            return explicit_str

        # Format the username and password, if available...
        username = os.environ.get("MONGO_USERNAME")
        password = os.environ.get("MONGO_PASSWORD")

        # If no username/password, use address only
        #  (e.g. localhost)
        mongodb_uri = os.environ.get("TR_MONGO_URI", "127.0.0.1:27017")
        if not username and not password:
            # No username
            return f"mongodb://{mongodb_uri}/"
        elif username and password:
            # Format mongo url with username/password
            return f"mongodb://{quote_plus(username)}:{quote_plus(password)}@{mongodb_uri}/"
        else:
            raise ValueError("both username and password must be set, or not set")

    def get_database(self, database_name: str) -> Database:
        if not database_name:
            return ValueError('"database_name" must be specified')

        return self._client[database_name]

    def get_collection(
        self, database_name: str, collection_name: str, should_prefix=True
    ) -> Collection:
        if not collection_name:
            return ValueError('"collection_name" must be specified')

        if should_prefix:
            collection_name = (
                os.environ.get("MONGO_COLLECTION_PREFIX", "tr_") + collection_name
            )

        return self.get_database(database_name)[collection_name]

    def current_op(self, database_name: str, user: str):
        """returns a summary of current ops for user"""
        import json

        db = self.get_database(database_name)
        current_ops = db.current_op()

        print(
            f"Current Mongo operations for {user}: ",
            json.dumps(
                current_ops,
                default=lambda o: f"<<non-serializable: {type(o).__qualname__}>>",
            ),
        )

        summaries = []
        for op in current_ops.get("inprog", []):
            comment = op.get("command", {}).get("comment")
            if not comment:
                continue

            comment = json.loads(comment)
            if user != comment["user"]:
                continue

            summaries.append(
                {
                    "comment": comment["message"],
                    "active": op["active"],
                    "currentOpTime": op["currentOpTime"],
                    "secs_running": op["secs_running"],
                    "microsecs_running": op["microsecs_running"],
                }
            )

        return summaries
