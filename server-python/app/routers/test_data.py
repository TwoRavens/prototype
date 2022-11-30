import sys
sys.path.insert(0, "..")

from main import app
from fastapi.testclient import TestClient
client = TestClient(app)


def test_current_op():
    response = client.get("/data/current-op")

    assert response.status_code == 200
    assert response.json()
