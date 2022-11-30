from schemas.database import (
    CurrentOperationDict,
    DeleteDatasetDict,
    RunS3ExportDict,
    RunS3ImportDict,
)
from services.database.connect import MongoClientUtil

from fastapi import APIRouter

router = APIRouter()


# We currently have no reason to call this endpoint, just execute the query directly in node
# @router.post("/data/query")
# def run_query(event: RunMongoQueryDict):
#     """execute mongoDB query"""
#     from services.database.run_query import run_query
#     return list(run_query(**event))


@router.post("/data/s3-import")
def run_s3_import(event: RunS3ImportDict):
    """dataset ingest from s3"""
    from services.database.run_import import run_import
    from util.data import DataCarrier

    # DEBUG TAG
    data = DataCarrier.read_s3_csv(**event["s3"])
    return run_import(data, **event["mongo"])


@router.post("/data/s3-export")
def run_s3_export(event: RunS3ExportDict) -> str:
    """dataset export to s3"""
    from services.database.run_query import run_query
    from util.data import DataCarrier

    values = run_query(**event["query"])
    return DataCarrier(columns=event["columns"], values=values).write_s3_csv(
        **event["s3"]
    )


@router.post("/data/delete")
def delete_dataset(event: DeleteDatasetDict):
    MongoClientUtil().get_collection(**event).drop()


@router.post("/data/current-op")
def current_op(event: CurrentOperationDict):
    """returns a summary of current ops for user"""
    MongoClientUtil().current_op(**event)
