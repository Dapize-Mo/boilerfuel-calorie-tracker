"""Tests for the health and readiness endpoints."""


def test_health_returns_ok(client):
    resp = client.get('/health')
    assert resp.status_code == 200
    assert resp.get_json() == {'status': 'ok'}


def test_ready_returns_ok_with_db(client):
    resp = client.get('/ready')
    data = resp.get_json()
    assert resp.status_code == 200
    assert data['app'] == 'ok'
    assert data['db'] == 'ok'


def test_unknown_route_returns_404(client):
    resp = client.get('/api/does-not-exist')
    assert resp.status_code == 404
