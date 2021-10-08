

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
                "data": lambda_func(event, context)
            }

        except Exception as err:
            import traceback
            import sys
            return {
                "success": False,
                "errorType": str(type(err)),
                "errorMessage": str(err),
                "stackTrace": traceback.format_exception(*sys.exc_info()),
            }

    return lambda_inner


@wrap_lambda
def search_h2o(event, context):
    import h2o
    h2o.init()
    h2o.demo('gbm')
