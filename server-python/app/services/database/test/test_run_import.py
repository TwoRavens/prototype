from app.util.data import DataCarrier
from app.services.database.run_import import run_import


def test_run_import():
    data = DataCarrier.read_s3_csv("tworavens", "baseball.csv")
    run_import(data, database_name="testing", collection_name="baseball")
