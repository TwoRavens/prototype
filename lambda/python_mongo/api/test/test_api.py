import os

os.environ["TR_S3_URI"] = "localhost:5000"
os.environ["TR_MONGO_URI"] = "127.0.0.1:27017"

from api.api import run_s3_import, run_s3_export


def test_s3_import():
    run_s3_import({
        "mongo": {
            "database_name": "tworavens",
            "collection_name": "baseball",
        },
        "s3": {
            "bucket": "tworavens",
            "key": "baseball.csv"
        }
    }, None)


def test_s3_export():
    print(run_s3_export({
        "query": {
            "database_name": "tworavens",
            "collection_name": "baseball",
            "method": "aggregate",
            "query": []
        },
        "columns": [],
        "s3": {
            "bucket": "tworavens",
            "key": "baseball_aggregated.csv"
        }
    }, None))

