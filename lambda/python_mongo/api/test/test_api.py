import os
os.environ["TR_LOCAL"] = "1"

from api.api import run_s3_import


def test_s3_import():
    print(run_s3_import({
        "mongo": {
            "database_name": "testing",
            "collection_name": "baseball",
        },
        "s3": {
            "bucket": "2ravens",
            "key": "baseball.csv"
        }
    }, None))


test_s3_import()
