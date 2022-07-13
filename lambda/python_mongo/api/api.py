from typing import TypedDict, Optional, List, Any, Literal

from api.database.connect import MongoClientUtil


class RunMongoQueryDict(TypedDict):
    database_name: str
    collection_name: str
    query: List[dict]
    method: str
    distinct: Optional[str]
    comment: Optional[str]
    user: Optional[str]
    host: Optional[Literal["TwoRavens", "UTDallas"]]


def run_query(event: RunMongoQueryDict, _context):
    """execute mongoDB query"""
    from api.database.run_query import run_query
    return list(run_query(**event))


class RunMongoImportDict(TypedDict):
    database_name: str
    collection_name: str
    reload: Optional[bool]
    indexes: Optional[List[str]]


class ReadS3CSVDict(TypedDict):
    bucket: str
    key: str
    reader_args: Any


class RunS3ImportDict(TypedDict):
    mongo: RunMongoImportDict
    s3: ReadS3CSVDict


def run_s3_import(event: RunS3ImportDict, _context):
    """dataset ingest from s3"""
    from api.database.run_import import run_import
    from api.data import DataCarrier

    # DEBUG TAG
    data = DataCarrier.read_s3_csv(**event['s3'])
    return run_import(data, **event['mongo'])


class WriteS3CSVDict(TypedDict):
    bucket: str
    key: str


class RunS3ExportDict(TypedDict):
    query: RunMongoQueryDict
    columns: List[str]
    s3: WriteS3CSVDict


def run_s3_export(event: RunS3ExportDict, _context) -> str:
    """dataset export to s3"""
    from api.database.run_query import run_query
    from api.data import DataCarrier
    values = run_query(**event['query'])
    return DataCarrier(columns=event['columns'], values=values).write_s3_csv(**event['s3'])


class DeleteDatasetDict(TypedDict):
    database_name: str
    collection_name: str


def delete_dataset(event: DeleteDatasetDict, _context):
    MongoClientUtil().get_collection(**event).drop()


class CurrentOperationDict(TypedDict):
    database_name: str
    user: str


def current_op(event: CurrentOperationDict, _context):
    """returns a summary of current ops for user"""
    MongoClientUtil().current_op(**event)


def root_handler(event, context):
    """AWS Lambda function

    :param: event
    :type: dict
    :param: context - Lambda Context runtime methods and attributes: https://docs.aws.amazon.com/lambda/latest/dg/python-context-object.html
    :type: dict
    """

    def unknown_handler(*_):
        raise ValueError(f"{event['kind']} is not a valid event kind")

    handler = {
        "run_query": run_query,
        "run_s3_import": run_s3_import,
        "run_s3_export": run_s3_export,
        "delete_dataset": delete_dataset,
        "current_op": current_op
    }.get(event['kind'], unknown_handler)

    try:
        lambda_func_eval = handler(event['event'], context)
        return {
            "success": True,
            "data": lambda_func_eval
        }

    except Exception as err:
        import traceback
        return {
            "success": False,
            "data": {
                "errorType": type(err).__name__,
                "errorMessage": str(err),
                "stackTrace": traceback.format_exc(),
            }
        }
