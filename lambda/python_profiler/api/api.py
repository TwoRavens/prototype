import json

from typing import TypedDict, Any

import pandas as pd

from raven_preprocess.preprocess_runner import PreprocessRunner

from datetime import date, datetime
import decimal

from .data import open_s3


class PreprocessJSONEncoder(json.JSONEncoder):
    """class to encode the data"""
    def default(self, obj):
        if isinstance(obj, decimal.Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()

        return super().default(obj)


class RunProfilerQueryDict(TypedDict):
    bucket: str
    key: str
    reader_args: Any


def run_preprocess(event: RunProfilerQueryDict, _context):
    """AWS lambda function for preprocess queries
    """
    data = pd.read_csv(
        open_s3(event['bucket'], event['key']),
        **event.get('reader_args') or {})

    runner = PreprocessRunner(data)
    if runner.has_error:
        raise ValueError(runner.error_message)
    return runner.get_final_dict()


def root_handler(event, context):
    """AWS Lambda function

    :param: event
    :type: dict
    :param: context - Lambda Context runtime methods and attributes: https://docs.aws.amazon.com/lambda/latest/dg/python-context-object.html
    :type: dict
    """

    try:
        return {
            "success": True,
            "data": run_preprocess(event['event'], context)
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


# def wrap_lambda(lambda_func):
#     """A decorator that wraps a lambda function in the AWS API Gateway Lambda Proxy Output Format
#     See https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
#
#     :param lambda_func: a function with the calling convention specified below
#     :type: Callable[[dict, dict], Any]
#     :returns: lambda_func's response wrapped in the API Gateway Lambda Proxy Output Format
#     :rtype: dict
#     """
#
#     def lambda_inner(event, context):
#         """AWS Lambda function
#
#         :param: API Gateway Lambda Proxy Input Format: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
#         :type: dict
#         :param: Lambda Context runtime methods and attributes: https://docs.aws.amazon.com/lambda/latest/dg/python-context-object.html
#         :type: dict
#         """
#
#         try:
#             return {
#                 "success": True,
#                 "body": json.dumps(lambda_func(event, context), cls=PreprocessJSONEncoder),
#             }
#
#         except Exception as err:
#             import traceback
#             import sys
#             return {
#                 "statusCode": 500,
#                 "headers": {
#                     "Lambda-Runtime-Function-Error-Type": "Unhandled"
#                 },
#                 "body": json.dumps({
#                     "errorType": str(type(err)),
#                     "errorMessage": str(err),
#                     "stackTrace": traceback.format_exception(*sys.exc_info()),
#                 }),
#             }
#
#     return lambda_inner
