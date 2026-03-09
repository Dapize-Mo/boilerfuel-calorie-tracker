"""Tests for the admin authentication endpoint."""


def test_admin_login_success(client):
    resp = client.post('/api/admin/login', json={'password': 'test-admin-pass'})
    assert resp.status_code == 200
    data = resp.get_json()
    assert 'token' in data


def test_admin_login_wrong_password(client):
    resp = client.post('/api/admin/login', json={'password': 'wrong'})
    assert resp.status_code == 401
    assert 'error' in resp.get_json()


def test_admin_login_missing_password(client):
    resp = client.post('/api/admin/login', json={})
    assert resp.status_code == 400
    assert 'error' in resp.get_json()


def test_admin_session_requires_auth(client):
    resp = client.get('/api/admin/session')
    assert resp.status_code == 401


def test_admin_session_with_valid_token(client, auth_headers):
    resp = client.get('/api/admin/session', headers=auth_headers)
    assert resp.status_code == 200
    assert resp.get_json()['status'] == 'ok'
