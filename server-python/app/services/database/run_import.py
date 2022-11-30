from app.services.database.connect import MongoClientUtil
from app.util.data import infer_type, encode_variable, DataCarrier
import os


def run_import(
    data: DataCarrier,
    database_name: str,
    collection_name: str,
    reload=False,
    indexes=None,
) -> None:
    """Load data into Mongo as a new collection"""

    # DEBUG TAG
    mongo_client = MongoClientUtil()
    db = mongo_client.get_database(database_name)

    # Check if dataset already loaded in mongo
    if (
        os.environ.get("MONGO_COLLECTION_PREFIX", "tr_") + collection_name
        in db.list_collection_names()
    ):
        if reload:
            db[collection_name].drop()
        else:
            return

    print(f"Importing {collection_name} into Mongo.")
    collection = mongo_client.get_collection(database_name, collection_name)

    # encode columns in a format that is compatible with MongoDB
    columns = [encode_variable(value) for value in data.columns]
    for value in data.values:
        collection.insert_one(
            {col: infer_type(val) for col, val in zip(columns, value)}
        )

    if indexes:
        for index in indexes:
            print(f"Creating index {index} on {collection_name}.")
            collection.create_index(index)
