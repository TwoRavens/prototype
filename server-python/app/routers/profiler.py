import pandas as pd

from raven_preprocess.preprocess_runner import PreprocessRunner

from schemas.profiler import ProfileQueryModel
from util.profiler import PreprocessJSONEncoder
import json

from .data import open_s3
from fastapi import APIRouter, Response

router = APIRouter()


@router.post("/profile/preprocess")
def run_preprocess(event: ProfileQueryModel):
    """AWS lambda function for preprocess queries"""
    data = pd.read_csv(
        open_s3(event["bucket"], event["key"]), **event.get("reader_args") or {}
    )

    runner = PreprocessRunner(data)
    if runner.has_error:
        raise ValueError(runner.error_message)
    final_dict = runner.get_final_dict()

    json_str = json.dumps(final_dict, cls=PreprocessJSONEncoder).encode("utf-8")
    return Response(media_type="application/json", content=json_str)
