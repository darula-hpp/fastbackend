def test_user_retrieve_override(client):
    response = client.get("/users/1")
    assert response.status_code == 200

    body = response.json()
    assert body["source"] == "custom-override"
    assert body["email"] == "override@example.com"
    assert body["id"] == 1


def test_default_create_still_works(client):
    response = client.post("/users", json={"name": "Ada", "email": "ada@example.com"})
    assert response.status_code == 200
    assert response.json()["email"] == "ada@example.com"
