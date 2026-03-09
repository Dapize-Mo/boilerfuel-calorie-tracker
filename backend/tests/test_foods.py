"""Tests for the /api/foods and /api/dining-courts endpoints."""

VALID_FOOD = {
    'name': 'Test Burger',
    'calories': 550,
    'macros': {'protein': 30.0, 'carbs': 45.0, 'fats': 22.0},
    'dining_court': 'Wiley',
    'station': 'Grill',
    'meal_time': 'lunch',
}


# ── GET /api/foods ──────────────────────────────────────────────────────────

def test_get_foods_empty(client):
    resp = client.get('/api/foods')
    assert resp.status_code == 200
    assert resp.get_json() == []


def test_get_foods_returns_added_food(client, auth_headers):
    client.post('/api/foods', json=VALID_FOOD, headers=auth_headers)
    resp = client.get('/api/foods')
    assert resp.status_code == 200
    foods = resp.get_json()
    assert len(foods) == 1
    assert foods[0]['name'] == 'Test Burger'
    assert foods[0]['calories'] == 550


def test_get_foods_search_filter(client, auth_headers):
    client.post('/api/foods', json=VALID_FOOD, headers=auth_headers)
    client.post(
        '/api/foods',
        json={**VALID_FOOD, 'name': 'Salad Bowl'},
        headers=auth_headers,
    )
    resp = client.get('/api/foods?q=burger')
    assert resp.status_code == 200
    foods = resp.get_json()
    assert len(foods) == 1
    assert foods[0]['name'] == 'Test Burger'


def test_get_foods_dining_court_filter(client, auth_headers):
    client.post('/api/foods', json=VALID_FOOD, headers=auth_headers)
    client.post(
        '/api/foods',
        json={**VALID_FOOD, 'name': 'Pasta', 'dining_court': 'Ford'},
        headers=auth_headers,
    )
    resp = client.get('/api/foods?dining_court=Wiley')
    assert resp.status_code == 200
    foods = resp.get_json()
    assert len(foods) == 1
    assert foods[0]['dining_court'] == 'Wiley'


def test_get_foods_meal_time_filter(client, auth_headers):
    client.post('/api/foods', json=VALID_FOOD, headers=auth_headers)
    client.post(
        '/api/foods',
        json={**VALID_FOOD, 'name': 'Eggs', 'meal_time': 'breakfast'},
        headers=auth_headers,
    )
    resp = client.get('/api/foods?meal_time=lunch')
    assert resp.status_code == 200
    foods = resp.get_json()
    assert all(f['meal_time'] == 'lunch' for f in foods)


# ── POST /api/foods ─────────────────────────────────────────────────────────

def test_add_food_success(client, auth_headers):
    resp = client.post('/api/foods', json=VALID_FOOD, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.get_json()
    assert data['food']['name'] == 'Test Burger'
    assert 'id' in data['food']


def test_add_food_requires_auth(client):
    resp = client.post('/api/foods', json=VALID_FOOD)
    assert resp.status_code == 401


def test_add_food_missing_name(client, auth_headers):
    food = {k: v for k, v in VALID_FOOD.items() if k != 'name'}
    resp = client.post('/api/foods', json=food, headers=auth_headers)
    assert resp.status_code == 400
    assert 'error' in resp.get_json()


def test_add_food_missing_macros(client, auth_headers):
    food = {k: v for k, v in VALID_FOOD.items() if k != 'macros'}
    resp = client.post('/api/foods', json=food, headers=auth_headers)
    assert resp.status_code == 400


def test_add_food_incomplete_macros(client, auth_headers):
    food = {**VALID_FOOD, 'macros': {'protein': 10.0}}
    resp = client.post('/api/foods', json=food, headers=auth_headers)
    assert resp.status_code == 400


# ── DELETE /api/foods/<id> ───────────────────────────────────────────────────

def test_delete_food_success(client, auth_headers):
    add_resp = client.post('/api/foods', json=VALID_FOOD, headers=auth_headers)
    food_id = add_resp.get_json()['food']['id']

    del_resp = client.delete(f'/api/foods/{food_id}', headers=auth_headers)
    assert del_resp.status_code == 200

    resp = client.get('/api/foods')
    assert resp.get_json() == []


def test_delete_food_not_found(client, auth_headers):
    resp = client.delete('/api/foods/9999', headers=auth_headers)
    assert resp.status_code == 404


def test_delete_food_requires_auth(client, auth_headers):
    add_resp = client.post('/api/foods', json=VALID_FOOD, headers=auth_headers)
    food_id = add_resp.get_json()['food']['id']
    resp = client.delete(f'/api/foods/{food_id}')
    assert resp.status_code == 401


# ── GET /api/dining-courts ───────────────────────────────────────────────────

def test_get_dining_courts_empty(client):
    resp = client.get('/api/dining-courts')
    assert resp.status_code == 200
    assert resp.get_json() == []


def test_get_dining_courts_lists_added_courts(client, auth_headers):
    client.post('/api/foods', json=VALID_FOOD, headers=auth_headers)
    client.post(
        '/api/foods',
        json={**VALID_FOOD, 'name': 'Pizza', 'dining_court': 'Ford'},
        headers=auth_headers,
    )
    resp = client.get('/api/dining-courts')
    assert resp.status_code == 200
    courts = resp.get_json()
    assert 'Wiley' in courts
    assert 'Ford' in courts
