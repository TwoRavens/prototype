from pydantic import BaseModel
from typing import Any, Literal, Optional


class S3ObjectModel(BaseModel):
    bucket: str
    key: str


class MongoQueryModel(BaseModel):
    database_name: str
    collection_name: str
    query: list[dict]
    method: str
    distinct: Optional[str]
    comment: Optional[str]
    user: Optional[str]
    host: Optional[Literal["TwoRavens", "UTDallas"]]


class MongoImportModel(BaseModel):
    database_name: str
    collection_name: str
    reload: Optional[bool]
    indexes: Optional[list[str]]


class ReadS3CSVModel(S3ObjectModel):
    bucket: str
    key: str
    reader_args: Any


class RunS3ImportDict(BaseModel):
    mongo: MongoImportModel
    s3: ReadS3CSVModel


class RunS3ExportDict(BaseModel):
    query: MongoQueryModel
    columns: list[str]
    s3: S3ObjectModel


class DeleteDatasetDict(BaseModel):
    database_name: str
    collection_name: str


class CurrentOperationDict(BaseModel):
    database_name: str
    user: str
