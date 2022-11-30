from datetime import datetime
import json
from typing import List

from bson.int64 import Int64
from bson.objectid import ObjectId
from dateutil import parser
from pymongo.collection import Collection
from pymongo.cursor import Cursor

from app.util.data import encode_variable, decode_variable
from app.services.database.connect import MongoClientUtil

HOST_CHOICES = ("TwoRavens", "UTDallas")


def run_query(
    database_name: str,
    collection_name: str,
    query: List[dict],
    method: str,
    distinct=None,
    comment=None,
    user=None,
    host="TwoRavens",
):

    if host not in HOST_CHOICES:
        raise ValueError(f"{host} must be in {HOST_CHOICES}")

    def encode(value):
        if type(value) is str and value.startswith("$"):
            return f"${encode_variable(value[1:])}"
        return value

    # replace extended query operators like $oid, $date and $numberLong with objects
    # change column names to avoid $, ., /
    def reformat(query_):
        # ---------------------------
        if issubclass(type(query_), list):
            # mutate query in-place
            query_temp = [encode(value) for value in query_]
            query_.clear()
            query_.extend(query_temp)
            for stage in query_:
                reformat(stage)
            return

        if issubclass(type(query_), dict):
            # mutate query in-place
            query_temp = {encode_variable(key): encode(query_[key]) for key in query_}
            query_.clear()
            query_.update(query_temp)

            for key in query_:
                if issubclass(type(query_[key]), list):
                    reformat(query_[key])
                    continue
                if not issubclass(type(query_[key]), dict):
                    continue

                # Convert strict oid tags into ObjectIds to allow id comparisons
                if "$oid" in query_[key]:
                    query_[key] = ObjectId(query_[key]["$oid"])
                # Convert date strings to datetime objects
                elif "$date" in query_[key]:
                    if isinstance(query_[key]["$date"], dict) and host == "UTDallas":
                        # attempt to work with this:self.exhausted = False
                        # https://github.com/Sayeedsalam/spec-event-data-server/blob/920c6b83f121587cfeedbb34516a1b8213ec6092/app_v2.py#L125
                        query_[key]["$date"] = "$date(%s)" % (query_[key]["$date"],)
                    if (
                        type(query_[key]["$date"]) is dict
                        and "$numberLong" in query_[key]["$date"]
                    ):
                        query_[key] = datetime.fromtimestamp(
                            int(Int64(query_[key]["$numberLong"]))
                        )
                    else:
                        query_[key] = parser.parse(query_[key]["$date"])
                elif "$numberLong" in query_[key]:
                    query_[key] = Int64(query_[key]["$numberLong"])
                else:
                    reformat(query_[key])

    try:
        reformat(query)
    except Exception as e:
        raise ValueError(f"Error reformatting query: {e}")

    if query is None:
        raise ValueError(f"No query specified.")

    if host == "UTDallas":
        return _run_utdallas_query(collection_name, method, query, distinct=distinct)

    # retrieve the collection
    collection: Collection = MongoClientUtil().get_collection(
        database_name, collection_name
    )

    comment = json.dumps({"user": user, "message": comment})

    if method == "find":
        cursor: Cursor = collection.find(query, comment=comment)
    elif method == "aggregate":
        cursor: Cursor = collection.aggregate(query, allowDiskUse=True, comment=comment)
    elif method == "count":
        return collection.count_documents(query, comment=comment)
    else:
        raise ValueError(f"unexpected Mongo method: {method}")

    if distinct:
        cursor = cursor.distinct(distinct)

    # serialize dates manually
    def serialize_fragment(data):
        if type(data) is datetime:
            return str(data)[:10]
        if issubclass(type(data), dict):
            return {decode_variable(key): serialize_fragment(data[key]) for key in data}
        if issubclass(type(data), list):
            return [serialize_fragment(element) for element in data]
        else:
            return data

    def serialize(data):
        for line in data:
            yield serialize_fragment(line)

    return serialize(cursor)


def _run_utdallas_query(collection_name, method, query, distinct=None):
    import os
    import requests

    url = (
        os.environ.get("UTDALLAS_PRODUCTION_SERVER_ADDRESS")
        + os.environ.get("UTDALLAS_SERVER_API_KEY")
        + "&datasource="
        + collection_name
    )

    if method == "count":
        query = json.dumps([{"$match": query}, {"$count": "total"}])
        return requests.get(url + "&aggregate=" + query).json()["data"][0]["total"]
    elif method == "find":
        unique = "&unique=" + distinct if distinct else ""
        return requests.get(url + "&query=" + json.dumps(query) + unique).json()["data"]
    elif method == "aggregate":
        return requests.get(url + "&aggregate=" + json.dumps(query)).json()["data"]
    else:
        raise ValueError(f"unexpected Mongo method: {method}")
