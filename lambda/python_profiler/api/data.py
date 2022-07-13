import os

import boto3
from botocore.config import Config
from smart_open import open as s_open


def open_s3(bucket, key, *args, **kwargs):
    """Open a byte stream to an S3 bucket's key"""
    endpoint_url = os.environ.get("TR_S3_URI", 'false')
    if endpoint_url != 'false':
        client = boto3.client(
            's3', endpoint_url=f'http://{endpoint_url}',
            config=Config(s3={'addressing_style': 'path'}))
        kwargs.setdefault('transport_params', {}).setdefault('client', client)

    return s_open(f's3://{bucket}/{key}', *args, **kwargs)
