from api.database.connect import MongoClientUtil


def test_connect():
    MongoClientUtil().get_collection("tworavens", "baseball")


def test_current_op():
    print(MongoClientUtil().current_op("tworavens", "user1"))
