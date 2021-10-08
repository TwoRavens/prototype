import csv
from typing import List, Iterable

from smart_open import open
import uuid


class DataCarrier(object):
    def __init__(self, columns: List[str], values: Iterable):
        self.columns = column_uniquify(columns)
        self.values = values

    def _location(self):
        import os
        if os.environ.get("TR_LOCAL"):
            os.path.join("localhost/"
            os.path.os.path.abspath(__file__)

    @staticmethod
    def read_s3_csv(bucket: str, key: str, reader_args=None) -> "DataCarrier":
        in_file = open(f's3://{bucket}/{key}')

        import csv
        reader = csv.reader(in_file, **reader_args or {})
        columns = next(reader)

        return DataCarrier(columns, reader)

    def write_s3_csv(self, bucket: str, key: str = None) -> str:
        """Export data to s3"""
        key = key or f'{uuid.uuid4()}.csv'

        with open(f's3://{bucket}/{key}') as out_file:
            dict_writer = csv.DictWriter(
                out_file,
                fieldnames=self.columns,
                extrasaction="ignore")
            dict_writer.writeheader()
            dict_writer.writerows(self.values)

        return key


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
    return name \
        .replace("\\.", "escaped_dot_symbol") \
        .replace("\\", "\\\\") \
        .replace("\$", "\\u0024") \
        .replace(".", "\\u002e") \
        .replace("escaped_dot_symbol", ".")


def decode_variable(name: str) -> str:
    """restore swapped symbols that had a special meaning in the mongodb engine"""
    return name \
        .replace("\\u002e", ".") \
        .replace("\\u0024", "\$") \
        .replace("\\\\", "\\")
