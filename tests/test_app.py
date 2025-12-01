from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)


def test_get_activities():
    r = client.get("/activities")
    assert r.status_code == 200
    data = r.json()
    # Basic smoke checks
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_and_unregister_flow():
    activity = "Chess Club"
    test_email = "pytest_user@example.com"

    # Ensure clean starting state
    if test_email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(test_email)

    before = list(activities[activity]["participants"])

    # Sign up
    r = client.post(f"/activities/{activity}/signup?email={test_email}")
    assert r.status_code == 200
    body = r.json()
    assert "Signed up" in body.get("message", "")
    assert test_email in activities[activity]["participants"]

    # GET should include the new participant
    r2 = client.get("/activities")
    assert r2.status_code == 200
    data = r2.json()
    assert test_email in data[activity]["participants"]

    # Attempt duplicate signup -> 400
    r_dup = client.post(f"/activities/{activity}/signup?email={test_email}")
    assert r_dup.status_code == 400

    # Unregister
    r3 = client.delete(f"/activities/{activity}/signup?email={test_email}")
    assert r3.status_code == 200
    body3 = r3.json()
    assert "Unregistered" in body3.get("message", "")
    assert test_email not in activities[activity]["participants"]

    # Attempt to unregister again -> 404
    r4 = client.delete(f"/activities/{activity}/signup?email={test_email}")
    assert r4.status_code == 404

    # Restore original state just in case
    activities[activity]["participants"] = before
