from api.database.connect import MongoClientUtil
from api.data import infer_type, encode_variable, DataCarrier


def run_import(
        data: DataCarrier,
        database_name: str,
        collection_name: str,
        reload=False,
        indexes=None) -> None:
    """Load data into Mongo as a new collection"""

    mongo_client = MongoClientUtil()
    db = mongo_client.get_database(database_name)

    # dataset already loaded in mongo
    if collection_name in db.list_collection_names():
        if reload:
            db[collection_name].drop()
        else:
            return

    print(f'Importing {collection_name} into Mongo.')
    collection = mongo_client.get_collection(database_name, collection_name)

    # encode columns in a format that is compatible with MongoDB
    columns = [encode_variable(value) for value in data.columns]
    with data.values as values:
        for value in values:
            collection.insert_one({col: infer_type(val) for col, val in zip(columns, value)})

    if indexes:
        for index in indexes:
            print(f'Creating index {index} on {collection_name}.')
            collection.create_index(index)
