import json
import boto3


def call_function(name, body):
    response = json.loads(boto3.client(
        service_name='lambda',
        endpoint_url='http://localhost:3001'
    ).invoke(
        FunctionName=name,
        InvocationType='RequestResponse',
        Payload=json.dumps(body).encode('UTF-8')
    )['Payload'].read().decode('utf-8'))

    if response['statusCode'] >= 400:
        print(response)
        raise ValueError(f'{response["statusCode"]} error')

    return json.loads(response['body'])


def test_solver_search():
    response = call_function('solver-search', {})

    assert response['message'] == 'dummy search complete'
