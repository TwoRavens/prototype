import csv
from typing import List, Iterable

import boto3
from smart_open import open as s_open
import os

from botocore.config import Config


class DataCarrier(object):
    def __init__(self, columns: List[str], values: Iterable):
        self.columns = column_uniquify(columns)
        self.values = values

    @staticmethod
    def open_s3(bucket, key, *args, **kwargs):
        """Open a byte stream to an S3 bucket's key"""

        endpoint_url = os.environ.get("TR_S3_URI") or None
        if endpoint_url:
            endpoint_url = f"http://{endpoint_url}"

        client = boto3.client(
            "s3",
            aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
            endpoint_url=endpoint_url,
            config=Config(s3={"addressing_style": "path"}) if endpoint_url else None,
        )
        kwargs.setdefault("transport_params", {}).setdefault("client", client)

        return s_open(f"s3://{bucket}/{key}", *args, **kwargs)

    @staticmethod
    def read_s3_csv(bucket: str, key: str, reader_args=None) -> "DataCarrier":

        import csv

        in_file = DataCarrier.open_s3(bucket, key)
        reader = csv.reader(in_file, **reader_args or {})
        columns = next(reader)

        return DataCarrier(columns, reader)

    def write_s3_csv(self, bucket: str, key: str = None):
        """Export data to s3"""

        with DataCarrier.open_s3(bucket, key, "w") as out_file:
            dict_writer = csv.DictWriter(
                out_file, fieldnames=self.columns, extrasaction="ignore"
            )
            dict_writer.writeheader()
            dict_writer.writerows(self.values)


def column_uniquify(column_names: List[str]) -> List[str]:
    """Check for duplicate names in a list and fix them"""
    if not isinstance(column_names, list):
        raise ValueError('"column_names" must be a list')

    new_columns = []
    for item in column_names:
        counter = 0
        new_item = item
        while new_item in new_columns:
            counter += 1
            new_item = f"{item}_{counter}"
        new_columns.append(new_item)

    return new_columns


def infer_type(value):
    """Used when loading data into a Mongo collection"""

    try:
        return int(value)
    except ValueError:
        pass

    try:
        return float(value)
    except ValueError:
        pass

    #     try:
    #         return parser.parse(value)
    #     except ValueError:
    #         pass

    if not len(value):
        return None

    return value


def encode_variable(name: str) -> str:
    """replace symbols that have special meaning in the mongodb engine"""
    return (
        name.replace("\\.", "escaped_dot_symbol")
        .replace("\\", "\\\\")
        .replace("\\$", "\\u0024")
        .replace(".", "\\u002e")
        .replace("escaped_dot_symbol", ".")
    )


def decode_variable(name: str) -> str:
    """restore swapped symbols that had a special meaning in the mongodb engine"""
    return name.replace("\\u002e", ".").replace("\\u0024", "\\$").replace("\\\\", "\\")
