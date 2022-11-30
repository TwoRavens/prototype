from pydantic import BaseModel
from typing import Any


class ProfileQueryModel(BaseModel):
    bucket: str
    key: str
    reader_args: Any
