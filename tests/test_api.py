import pytest
from app import create_app, db


@pytest.fixture
def client():
    app = create_app()
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    app.config["TESTING"] = True

    with app.app_context():
        db.create_all()
        with app.test_client() as client:
            yield client
        db.drop_all()


def test_get_scores_empty(client):
    resp = client.get("/api/scores")
    assert resp.status_code == 200
    assert resp.get_json() == []


def test_post_score(client):
    resp = client.post("/api/scores", json={
        "player_name": "Alice",
        "score": 12400,
        "lines": 24,
        "level": 3,
    })
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["player_name"] == "Alice"
    assert data["score"] == 12400


def test_get_scores_ordered(client):
    for name, score in [("Low", 100), ("High", 9999), ("Mid", 5000)]:
        client.post("/api/scores", json={
            "player_name": name, "score": score, "lines": 1, "level": 1,
        })
    resp = client.get("/api/scores")
    data = resp.get_json()
    assert [d["player_name"] for d in data] == ["High", "Mid", "Low"]


def test_get_scores_limit(client):
    for i in range(5):
        client.post("/api/scores", json={
            "player_name": f"P{i}", "score": i * 100, "lines": 1, "level": 1,
        })
    resp = client.get("/api/scores?limit=2")
    assert len(resp.get_json()) == 2


def test_post_score_missing_fields(client):
    resp = client.post("/api/scores", json={"player_name": "X"})
    assert resp.status_code == 400


def test_post_score_empty_name(client):
    resp = client.post("/api/scores", json={
        "player_name": "", "score": 100, "lines": 1, "level": 1,
    })
    assert resp.status_code == 400


def test_post_score_name_too_long(client):
    resp = client.post("/api/scores", json={
        "player_name": "A" * 21, "score": 100, "lines": 1, "level": 1,
    })
    assert resp.status_code == 400
