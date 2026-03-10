"""Tests for the /api/activities endpoints."""

VALID_ACTIVITY = {
    'name': 'Running',
    'calories_per_hour': 600,
}


# ── GET /api/activities ──────────────────────────────────────────────────────

def test_get_activities_empty(client):
    resp = client.get('/api/activities')
    assert resp.status_code == 200
    assert resp.get_json() == []


def test_get_activities_returns_added_activity(client, auth_headers):
    client.post('/api/activities', json=VALID_ACTIVITY, headers=auth_headers)
    resp = client.get('/api/activities')
    assert resp.status_code == 200
    activities = resp.get_json()
    assert len(activities) == 1
    assert activities[0]['name'] == 'Running'
    assert activities[0]['calories_per_hour'] == 600


def test_get_activities_search_filter(client, auth_headers):
    client.post('/api/activities', json=VALID_ACTIVITY, headers=auth_headers)
    client.post(
        '/api/activities',
        json={'name': 'Cycling', 'calories_per_hour': 400},
        headers=auth_headers,
    )
    resp = client.get('/api/activities?q=run')
    assert resp.status_code == 200
    activities = resp.get_json()
    assert len(activities) == 1
    assert activities[0]['name'] == 'Running'


# ── POST /api/activities ─────────────────────────────────────────────────────

def test_add_activity_success(client, auth_headers):
    resp = client.post('/api/activities', json=VALID_ACTIVITY, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.get_json()
    assert data['activity']['name'] == 'Running'
    assert 'id' in data['activity']


def test_add_activity_requires_auth(client):
    resp = client.post('/api/activities', json=VALID_ACTIVITY)
    assert resp.status_code == 401


def test_add_activity_missing_name(client, auth_headers):
    resp = client.post(
        '/api/activities',
        json={'calories_per_hour': 600},
        headers=auth_headers,
    )
    assert resp.status_code == 400
    assert 'error' in resp.get_json()


def test_add_activity_missing_calories(client, auth_headers):
    resp = client.post(
        '/api/activities',
        json={'name': 'Swimming'},
        headers=auth_headers,
    )
    assert resp.status_code == 400
    assert 'error' in resp.get_json()


# ── DELETE /api/activities/<id> ──────────────────────────────────────────────

def test_delete_activity_success(client, auth_headers):
    add_resp = client.post('/api/activities', json=VALID_ACTIVITY, headers=auth_headers)
    activity_id = add_resp.get_json()['activity']['id']

    del_resp = client.delete(f'/api/activities/{activity_id}', headers=auth_headers)
    assert del_resp.status_code == 200

    resp = client.get('/api/activities')
    assert resp.get_json() == []


def test_delete_activity_not_found(client, auth_headers):
    resp = client.delete('/api/activities/9999', headers=auth_headers)
    assert resp.status_code == 404


def test_delete_activity_requires_auth(client, auth_headers):
    add_resp = client.post('/api/activities', json=VALID_ACTIVITY, headers=auth_headers)
    activity_id = add_resp.get_json()['activity']['id']
    resp = client.delete(f'/api/activities/{activity_id}')
    assert resp.status_code == 401
