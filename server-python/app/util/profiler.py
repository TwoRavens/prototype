import json
import decimal
from datetime import date, datetime


class PreprocessJSONEncoder(json.JSONEncoder):
    """class to encode the data"""

    def default(self, obj):
        if isinstance(obj, decimal.Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()

        return super().default(obj)
