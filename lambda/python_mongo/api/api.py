import json
from api.database.connect import MongoClientUtil

from typing import TypedDict, Optional, List, Any, Literal


def wrap_lambda(lambda_func):
    """A decorator that wraps a lambda function in the AWS API Gateway Lambda Proxy Output Format
    See https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html

    :param lambda_func: a function with the calling convention specified below
    :type: Callable[[dict, dict], Any]
    :returns: lambda_func's response wrapped in the API Gateway Lambda Proxy Output Format
    :rtype: dict
    """

    def lambda_inner(event, context):
        """AWS Lambda function

        :param: API Gateway Lambda Proxy Input Format: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
        :type: dict
        :param: Lambda Context runtime methods and attributes: https://docs.aws.amazon.com/lambda/latest/dg/python-context-object.html
        :type: dict
        """

        try:
            return {
                "success": True,
                "body": json.dumps(lambda_func(event, context)),
            }

        except Exception as err:
            import traceback
            import sys
            return {
                "statusCode": 500,
                "headers": {
                    "Lambda-Runtime-Function-Error-Type": "Unhandled"
                },
                "body": json.dumps({
                    "errorType": str(type(err)),
                    "errorMessage": str(err),
                    "stackTrace": traceback.format_exception(*sys.exc_info()),
                }),
            }

    return lambda_inner


import os
if os.environ.get("TR_LOCAL"):
    wrap_lambda = lambda v: v


class RunMongoQueryDict(TypedDict):
    database_name: str
    collection_name: str
    query: List[dict]
    method: str
    distinct: Optional[str]
    comment: Optional[str]
    user: Optional[str]
    host: Optional[Literal["TwoRavens", "UTDallas"]]


@wrap_lambda
def run_query(event: RunMongoQueryDict, _context):
    """AWS lambda function for mongoDB queries
    """
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


@wrap_lambda
def run_s3_import(event: RunS3ImportDict, _context):
    """AWS lambda function for dataset ingest from s3"""
    from api.database.run_import import run_import
    from api.data import DataCarrier

    data = DataCarrier.read_s3_csv(**event['s3'])
    return run_import(data, **event['mongo'])


class WriteS3CSVDict(TypedDict):
    bucket: str
    key: Optional[str]


class RunS3ExportDict(TypedDict):
    query: RunMongoQueryDict
    columns: List[str]
    s3: WriteS3CSVDict


@wrap_lambda
def run_s3_export(event: RunS3ExportDict, _context) -> str:
    """AWS lambda function for dataset export to s3"""
    from api.database.run_query import run_query
    from api.data import DataCarrier
    values = run_query(**event['query'])
    return DataCarrier(columns=event['columns'], values=values).write_s3_csv(**event['s3'])


class DeleteDatasetDict(TypedDict):
    database_name: str
    collection_name: str


@wrap_lambda
def delete_dataset(event: DeleteDatasetDict, _context):
    MongoClientUtil().get_collection(**event).drop()


class CurrentOperationDict(TypedDict):
    database_name: str
    user: str


@wrap_lambda
def current_op(event: CurrentOperationDict, _context):
    """
    returns a summary of current ops for user
    :return:
    """
    MongoClientUtil().current_op(**event)
