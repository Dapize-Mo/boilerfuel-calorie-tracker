import os
import threading
from datetime import datetime, timezone, timedelta

import jwt
from django.db import connection, transaction
from django.http import JsonResponse, HttpRequest
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views.decorators.http import require_GET, require_http_methods
from django.db.models import Q

from .models import Food, Activity
from .serializers import FoodSerializer, ActivitySerializer
from django.conf import settings

# Simple helpers to read JSON body
import json

def json_body(request: HttpRequest):
    try:
        if request.body:
            return json.loads(request.body.decode('utf-8'))
    except Exception:
        pass
    return {}


def admin_enabled():
    return bool(os.getenv('ADMIN_PASSWORD', ''))


def create_access_token(identity: str, additional_claims: dict | None = None):
    payload = {
        'sub': identity,
        'exp': datetime.utcnow() + timedelta(days=settings.JWT_ACCESS_TOKEN_EXPIRES),
        'iat': datetime.utcnow(),
    }
    if additional_claims:
        payload.update(additional_claims)
    token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm='HS256')
    if isinstance(token, bytes):
        token = token.decode('utf-8')
    return token


def get_bearer_token(request: HttpRequest):
    auth = request.headers.get('Authorization') or ''
    if auth.startswith('Bearer '):
        return auth.split(' ', 1)[1]
    return None


def decode_token(token: str):
    try:
        return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=['HS256'])
    except Exception:
        return None


def admin_required(view_func):
    def _wrapped(request: HttpRequest, *args, **kwargs):
        token = get_bearer_token(request)
        if not token:
            return JsonResponse({'error': 'Missing token'}, status=401)
        payload = decode_token(token)
        if not payload or not payload.get('is_admin'):
            return JsonResponse({'error': 'Admin privileges required'}, status=403)
        return view_func(request, *args, **kwargs)
    return _wrapped


@require_GET
def health_check(request: HttpRequest):
    return JsonResponse({'status': 'ok'})


@require_GET
def ready_check(request: HttpRequest):
    try:
        with connection.cursor() as cursor:
            cursor.execute('SELECT 1')
        return JsonResponse({'app': 'ok', 'db': 'ok'})
    except Exception:
        return JsonResponse({'app': 'ok', 'db': 'error'}, status=500)


@csrf_exempt
@require_http_methods(["POST", "GET"])
def init_database(request: HttpRequest):
    # Ensure tables exist via migrations outside; here only seed when empty
    try:
        if Food.objects.exists() or Activity.objects.exists():
            return JsonResponse({'message': 'Database already initialized with existing data'})

        sample_foods = [
            {'name': 'Grilled Chicken Breast', 'calories': 165, 'macros': {'protein': 31, 'carbs': 0, 'fats': 3.6}},
            {'name': 'Brown Rice (1 cup)', 'calories': 216, 'macros': {'protein': 5, 'carbs': 45, 'fats': 1.8}},
            {'name': 'Broccoli (1 cup)', 'calories': 25, 'macros': {'protein': 3, 'carbs': 5, 'fats': 0.3}},
            {'name': 'Salmon Fillet', 'calories': 206, 'macros': {'protein': 22, 'carbs': 0, 'fats': 12}},
            {'name': 'Oatmeal (1 cup)', 'calories': 147, 'macros': {'protein': 6, 'carbs': 25, 'fats': 3}},
        ]
        Food.objects.bulk_create([
            Food(name=f['name'], calories=f['calories'], macros=f['macros'])
            for f in sample_foods
        ])

        sample_activities = [
            {'name': 'Running', 'calories_per_hour': 600},
            {'name': 'Walking', 'calories_per_hour': 280},
            {'name': 'Cycling', 'calories_per_hour': 500},
            {'name': 'Swimming', 'calories_per_hour': 450},
            {'name': 'Weight Training', 'calories_per_hour': 365},
            {'name': 'Yoga', 'calories_per_hour': 180},
            {'name': 'Basketball', 'calories_per_hour': 440},
            {'name': 'Elliptical', 'calories_per_hour': 400},
        ]
        Activity.objects.bulk_create([
            Activity(name=a['name'], calories_per_hour=a['calories_per_hour'])
            for a in sample_activities
        ])
        return JsonResponse({'message': 'Database initialized successfully!', 'foods_added': len(sample_foods), 'activities_added': len(sample_activities)}, status=201)
    except Exception as exc:
        return JsonResponse({'error': f'Database initialization failed: {exc}'}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def admin_login(request: HttpRequest):
    data = json_body(request)
    password = (data.get('password') or '').strip()
    if not admin_enabled():
        return JsonResponse({'error': 'Admin authentication is not configured'}, status=503)
    if not password:
        return JsonResponse({'error': 'Password is required'}, status=400)
    if password != os.getenv('ADMIN_PASSWORD', ''):
        return JsonResponse({'error': 'Invalid password'}, status=401)
    token = create_access_token('admin', {'is_admin': True})
    return JsonResponse({'token': token})


@admin_required
@require_GET
def admin_session(request: HttpRequest):
    return JsonResponse({'status': 'ok'})


@require_GET
def get_dining_courts(request: HttpRequest):
    try:
        courts = (
            Food.objects.filter(~Q(dining_court=None))
            .values_list('dining_court', flat=True)
            .distinct()
            .order_by('dining_court')
        )
        return JsonResponse(list(courts), safe=False)
    except Exception as exc:
        return JsonResponse({'error': f'Failed to fetch dining courts: {exc}'}, status=500)


@csrf_exempt
@require_http_methods(["GET", "POST"])
def foods_list_create(request: HttpRequest):
    if request.method == 'GET':
        q = request.GET.get('q')
        dining_court = request.GET.get('dining_court')
        meal_time = request.GET.get('meal_time')
        qs = Food.objects.all().order_by('name')
        if q:
            qs = qs.filter(name__icontains=q)
        if dining_court:
            qs = qs.filter(dining_court=dining_court)
        if meal_time:
            qs = qs.filter(meal_time=meal_time)
        data = FoodSerializer(qs, many=True).data
        return JsonResponse(data, safe=False)
    else:
        # POST requires admin
        decorated = admin_required(lambda r: r)
        resp = decorated(request)
        if isinstance(resp, JsonResponse):
            return resp
        data = json_body(request)
        for field in ['name', 'calories', 'macros']:
            if field not in data:
                return JsonResponse({'error': f'Missing required field: {field}'}, status=400)
        macros = data.get('macros') or {}
        for key in ['protein', 'carbs', 'fats']:
            if key not in macros:
                return JsonResponse({'error': f"Macros must include '{key}'"}, status=400)
        try:
            food = Food(
                name=str(data['name']).strip(),
                calories=int(data['calories']),
                macros={
                    'protein': float(macros['protein']),
                    'carbs': float(macros['carbs']),
                    'fats': float(macros['fats']),
                },
                dining_court=data.get('dining_court'),
                station=data.get('station'),
            )
            food.save()
            return JsonResponse({'message': 'Food added successfully!', 'food': FoodSerializer(food).data}, status=201)
        except Exception as exc:
            return JsonResponse({'error': f'Failed to add food: {exc}'}, status=500)


@csrf_exempt
@require_http_methods(["DELETE"])
def foods_delete(request: HttpRequest, food_id: int):
    decorated = admin_required(lambda r: r)
    resp = decorated(request)
    if isinstance(resp, JsonResponse):
        return resp
    try:
        food = Food.objects.filter(id=food_id).first()
        if not food:
            return JsonResponse({'error': 'Food not found'}, status=404)
        food.delete()
        return JsonResponse({'message': 'Food deleted'})
    except Exception as exc:
        return JsonResponse({'error': f'Failed to delete food: {exc}'}, status=500)


@csrf_exempt
@require_http_methods(["GET", "POST"])
def activities_list_create(request: HttpRequest):
    if request.method == 'GET':
        q = request.GET.get('q')
        qs = Activity.objects.all().order_by('name')
        if q:
            qs = qs.filter(name__icontains=q)
        data = ActivitySerializer(qs, many=True).data
        return JsonResponse(data, safe=False)
    else:
        decorated = admin_required(lambda r: r)
        resp = decorated(request)
        if isinstance(resp, JsonResponse):
            return resp
        data = json_body(request)
        for field in ['name', 'calories_per_hour']:
            if field not in data:
                return JsonResponse({'error': f'Missing required field: {field}'}, status=400)
        try:
            activity = Activity(name=str(data['name']).strip(), calories_per_hour=int(data['calories_per_hour']))
            activity.save()
            return JsonResponse({'message': 'Activity added successfully!', 'activity': ActivitySerializer(activity).data}, status=201)
        except Exception as exc:
            return JsonResponse({'error': f'Failed to add activity: {exc}'}, status=500)


@csrf_exempt
@require_http_methods(["DELETE"])
def activities_delete(request: HttpRequest, activity_id: int):
    decorated = admin_required(lambda r: r)
    resp = decorated(request)
    if isinstance(resp, JsonResponse):
        return resp
    try:
        activity = Activity.objects.filter(id=activity_id).first()
        if not activity:
            return JsonResponse({'error': 'Activity not found'}, status=404)
        activity.delete()
        return JsonResponse({'message': 'Activity deleted'})
    except Exception as exc:
        return JsonResponse({'error': f'Failed to delete activity: {exc}'}, status=500)


# Scraper integration
scraping_status = {
    'in_progress': False,
    'last_result': None,
    'last_error': None,
}

def _run_scraper_save():
    global scraping_status
    try:
        import sys
        import os
        repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
        scraper_path = os.path.join(repo_root, 'scraper')
        if scraper_path not in sys.path:
            sys.path.insert(0, scraper_path)
        from scraper.menu_scraper import scrape_all_dining_courts

        items = scrape_all_dining_courts(use_cache=True)
        if not items:
            scraping_status['in_progress'] = False
            scraping_status['last_error'] = 'No menu items found'
            return
        added_count = 0
        updated_count = 0
        skipped_count = 0
        for item in items:
            if item['calories'] == 0 and item['protein'] == 0 and item['carbs'] == 0 and item['fats'] == 0:
                skipped_count += 1
                continue
            existing = Food.objects.filter(name=item['name'], dining_court=item.get('dining_court')).first()
            if existing:
                if existing.calories == 0 and item['calories'] > 0:
                    existing.calories = item['calories']
                    existing.macros = {
                        'protein': item['protein'],
                        'carbs': item['carbs'],
                        'fats': item['fats'],
                    }
                    existing.station = item.get('station')
                    existing.save()
                    updated_count += 1
                else:
                    skipped_count += 1
            else:
                Food.objects.create(
                    name=item['name'],
                    calories=item['calories'],
                    macros={
                        'protein': item['protein'],
                        'carbs': item['carbs'],
                        'fats': item['fats'],
                    },
                    dining_court=item.get('dining_court'),
                    station=item.get('station'),
                )
                added_count += 1
        scraping_status['in_progress'] = False
        scraping_status['last_result'] = {
            'items_added': added_count,
            'items_updated': updated_count,
            'items_skipped': skipped_count,
            'total_scraped': len(items),
        }
        scraping_status['last_error'] = None
    except Exception as exc:
        scraping_status['in_progress'] = False
        scraping_status['last_error'] = str(exc)


@csrf_exempt
@require_http_methods(["POST"])
@admin_required
def scrape_menus(request: HttpRequest):
    global scraping_status
    if scraping_status['in_progress']:
        return JsonResponse({'error': 'Scraping already in progress'}, status=409)
    scraping_status['in_progress'] = True
    scraping_status['last_result'] = None
    scraping_status['last_error'] = None
    thread = threading.Thread(target=_run_scraper_save, daemon=True)
    thread.start()
    return JsonResponse({'message': 'Scraping started in background. Check /api/scrape-status for progress.'}, status=202)


@require_GET
@admin_required
def scrape_status(request: HttpRequest):
    if scraping_status['in_progress']:
        return JsonResponse({'status': 'in_progress', 'message': 'Scraping is currently running...'})
    elif scraping_status['last_error']:
        return JsonResponse({'status': 'error', 'error': scraping_status['last_error']}, status=500)
    elif scraping_status['last_result']:
        result = scraping_status['last_result']
        message = f"Menu scraping complete! Added {result['items_added']} new items"
        if result['items_updated'] > 0:
            message += f", updated {result['items_updated']} items"
        resp = {'status': 'complete', 'message': message}
        resp.update(result)
        return JsonResponse(resp)
    else:
        return JsonResponse({'status': 'idle', 'message': 'No scraping operation has been run yet'})


@csrf_exempt
@require_http_methods(["POST"])
@admin_required
def scrape_menus_sync(request: HttpRequest):
    try:
        import sys
        import os
        repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
        scraper_path = os.path.join(repo_root, 'scraper')
        if scraper_path not in sys.path:
            sys.path.insert(0, scraper_path)
        from scraper.menu_scraper import scrape_all_dining_courts

        items = scrape_all_dining_courts(use_cache=True)
        if not items:
            return JsonResponse({'error': 'No menu items found'}, status=404)
        added_count = 0
        updated_count = 0
        skipped_count = 0
        for item in items:
            if item['calories'] == 0 and item['protein'] == 0 and item['carbs'] == 0 and item['fats'] == 0:
                skipped_count += 1
                continue
            existing = Food.objects.filter(name=item['name'], dining_court=item.get('dining_court')).first()
            if existing:
                if existing.calories == 0 and item['calories'] > 0:
                    existing.calories = item['calories']
                    existing.macros = {
                        'protein': item['protein'],
                        'carbs': item['carbs'],
                        'fats': item['fats'],
                    }
                    existing.station = item.get('station')
                    existing.save()
                    updated_count += 1
                else:
                    skipped_count += 1
            else:
                Food.objects.create(
                    name=item['name'],
                    calories=item['calories'],
                    macros={
                        'protein': item['protein'],
                        'carbs': item['carbs'],
                        'fats': item['fats'],
                    },
                    dining_court=item.get('dining_court'),
                    station=item.get('station'),
                )
                added_count += 1
        message = f'Menu scraping complete! Added {added_count} new items'
        if updated_count > 0:
            message += f', updated {updated_count} items'
        return JsonResponse({'message': message, 'items_added': added_count, 'items_updated': updated_count, 'items_skipped': skipped_count, 'total_scraped': len(items)}, status=201)
    except Exception as exc:
        return JsonResponse({'error': f'Scraping failed: {str(exc)}'}, status=500)


@csrf_exempt
@require_http_methods(["DELETE"])
@admin_required
def clear_placeholders(request: HttpRequest):
    try:
        placeholders = Food.objects.filter(dining_court__isnull=True)
        count = placeholders.count()
        placeholders.delete()
        return JsonResponse({'message': f'Successfully deleted {count} placeholder items', 'deleted_count': count})
    except Exception as exc:
        return JsonResponse({'error': f'Failed to delete placeholders: {str(exc)}'}, status=500)
