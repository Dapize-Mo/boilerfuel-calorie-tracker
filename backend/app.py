from __future__ import annotations

# pyright: reportGeneralTypeIssues=false, reportAttributeAccessIssue=false

import sys
import os
# Add parent directory to path to import scraper module
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from datetime import datetime, timezone, timedelta
from functools import wraps
from urllib.parse import quote_plus, urlparse, urlunparse

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, get_jwt, jwt_required
from sqlalchemy.sql.expression import text

# Note: Environment variables should be set externally (e.g., via start.bat or your hosting provider)
# Load .env file only if it exists and we're in development
try:
	from dotenv import load_dotenv
	if os.path.exists('.env') and not os.getenv('DATABASE_URL'):
		load_dotenv()
except ImportError:
	pass

app = Flask(__name__)

# Allow the frontend (Next.js) to communicate with the API during development/hosting
cors_origin = os.getenv('FRONTEND_ORIGIN', '*')

# If FRONTEND_ORIGIN is set, also allow Vercel preview deployments
if cors_origin and cors_origin != '*':
	# Split by comma to support multiple origins
	allowed_origins = [origin.strip() for origin in cors_origin.split(',')]
else:
	allowed_origins = cors_origin

def is_vercel_domain(origin):
	"""Check if origin is from Vercel (includes preview deployments)"""
	if not origin:
		return False
	return origin.startswith('https://') and '.vercel.app' in origin

# Custom CORS handler to allow Vercel preview URLs
@app.after_request
def after_request(response):
	origin = request.headers.get('Origin')
	
	# Check if origin is allowed
	if cors_origin == '*':
		response.headers['Access-Control-Allow-Origin'] = '*'
	elif isinstance(allowed_origins, list):
		if origin in allowed_origins or is_vercel_domain(origin):
			response.headers['Access-Control-Allow-Origin'] = origin
	elif origin == allowed_origins or is_vercel_domain(origin):
		response.headers['Access-Control-Allow-Origin'] = origin
	
	response.headers['Access-Control-Allow-Credentials'] = 'true'
	response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
	response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
	return response

CORS(
	app,
	resources={r"/api/*": {"origins": cors_origin}},
	supports_credentials=True,
)


def _env_or_none(name: str):
	val = os.getenv(name)
	# Treat unresolved template references like {{ Postgres.DATABASE_URL }} as unset
	# allow platform variables like ${{Postgres.DATABASE_URL}}
	if val and ('{{' in val or '}}' in val) and not val.startswith('${{'):
		return None
	return val


def _build_db_url_from_parts():
	"""Build a Postgres URL from discrete POSTGRES_* env vars if provided."""

	host = _env_or_none('POSTGRES_HOST') or _env_or_none('PGHOST')
	port = _env_or_none('POSTGRES_PORT') or _env_or_none('PGPORT') or '5432'
	user = _env_or_none('POSTGRES_USER') or _env_or_none('PGUSER')
	password = _env_or_none('POSTGRES_PASSWORD') or _env_or_none('PGPASSWORD')
	dbname = (
		_env_or_none('POSTGRES_DB')
		or _env_or_none('POSTGRES_DATABASE')
		or _env_or_none('PGDATABASE')
	)
	if host and user and password and dbname:
		# URL encode username/password in case they contain special chars
		return (
			f"postgresql://{quote_plus(user)}:{quote_plus(password)}@{host}:{port}/"
			f"{quote_plus(dbname)}"
		)
	return None


def _preferred_database_url():
	"""Resolve a usable database URL across common providers."""

	candidates = [
		'DATABASE_URL',
		'DATABASE_PUBLIC_URL',  # some platforms expose a public variant
		'POSTGRES_URL',
	]
	for key in candidates:
		val = _env_or_none(key)
		if val:
			return val
	# Try assembling from discrete POSTGRES_* parts
	assembled = _build_db_url_from_parts()
	if assembled:
		return assembled
	# Fallback to local SQLite for development
	return 'sqlite:///boilerfuel.db'


# Database configuration
database_url = _preferred_database_url()

# Force SQLite for local development if no DATABASE_URL is set
if not os.getenv('DATABASE_URL') and database_url.startswith('postgresql://'):
	database_url = 'sqlite:///boilerfuel.db'
	print(f"[startup] Forced SQLite database for local development")

if database_url.startswith('postgres://'):
	database_url = database_url.replace('postgres://', 'postgresql://', 1)
if database_url.startswith('postgresql://') and '+psycopg2' not in database_url:
	database_url = database_url.replace('postgresql://', 'postgresql+psycopg2://', 1)

# Apply SSL mode only for PostgreSQL (not for SQLite)
if database_url.startswith('postgresql'):
	sslmode = os.getenv('DATABASE_SSLMODE') or os.getenv('PGSSLMODE')
	if sslmode:
		separator = '&' if '?' in database_url else '?'
		database_url = f"{database_url}{separator}sslmode={sslmode}"
	else:
		if 'sslmode=' not in database_url and not any(
			h in database_url for h in ['localhost', '127.0.0.1']
		):
			separator = '&' if '?' in database_url else '?'
			database_url = f"{database_url}{separator}sslmode=require"

app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'change-me')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)
app.config['JSON_SORT_KEYS'] = False
app.config['ADMIN_PASSWORD'] = os.getenv('ADMIN_PASSWORD', '')

# Log a sanitized DB URL at startup to assist debugging in hosted logs
try:
	parsed = urlparse(database_url)
	username = parsed.username or ''
	password = '***' if parsed.password else None
	host = parsed.hostname or ''
	port = f":{parsed.port}" if parsed.port else ''
	if username and password is not None:
		netloc = f"{username}:{password}@{host}{port}"
	elif username:
		netloc = f"{username}@{host}{port}"
	else:
		netloc = f"{host}{port}"
	sanitized = urlunparse(
		(
			parsed.scheme,
			netloc,
			parsed.path or '',
			parsed.params or '',
			parsed.query or '',
			parsed.fragment or '',
		)
	)
	print(f"[startup] SQLALCHEMY_DATABASE_URI -> {sanitized}")
except Exception:
	# Non-fatal; just don't log if parsing fails
	pass


import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'scraper')))
from scraper import menu_scraper
# Initialize extensions
db: SQLAlchemy = SQLAlchemy(app)
jwt = JWTManager(app)


# Models
class Food(db.Model):
	__tablename__ = 'foods'

	id = db.Column(db.Integer, primary_key=True)
	name = db.Column(db.String(255), nullable=False)
	calories = db.Column(db.Integer, nullable=False)
	macros = db.Column(db.JSON, nullable=False)
	dining_court = db.Column(db.String(100), nullable=True)
	station = db.Column(db.String(255), nullable=True)
	meal_time = db.Column(db.String(50), nullable=True)  # breakfast, lunch, late lunch, dinner
	next_available = db.Column(db.JSON, nullable=True)  # Array of {date, day_name, meal_time} for next 7 days
	created_at = db.Column(
		db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
	)


class Activity(db.Model):
	__tablename__ = 'activities'

	id = db.Column(db.Integer, primary_key=True)
	name = db.Column(db.String(255), nullable=False)
	calories_per_hour = db.Column(db.Integer, nullable=False)
	created_at = db.Column(
		db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
	)


def admin_enabled() -> bool:
	return bool(app.config.get('ADMIN_PASSWORD'))


def admin_required(fn):
	@wraps(fn)
	@jwt_required()
	def wrapper(*args, **kwargs):
		claims = get_jwt() or {}
		if not claims.get('is_admin'):
			return jsonify({'error': 'Admin privileges required'}), 403
		return fn(*args, **kwargs)

	return wrapper


@app.route('/api/admin/login', methods=['POST'])
def admin_login():
	data = request.get_json() or {}
	password = (data.get('password') or '').strip()

	if not admin_enabled():
		return jsonify({'error': 'Admin authentication is not configured'}), 503
	if not password:
		return jsonify({'error': 'Password is required'}), 400
	if password != app.config['ADMIN_PASSWORD']:
		return jsonify({'error': 'Invalid password'}), 401

	token = create_access_token(identity='admin', additional_claims={'is_admin': True})
	return jsonify({'token': token}), 200


@app.route('/api/admin/session', methods=['GET'])
@admin_required
def admin_session():
	return jsonify({'status': 'ok'}), 200


@app.route('/api/dining-courts', methods=['GET'])
def get_dining_courts():
	"""Get list of available dining courts from the foods table."""
	try:
		result = db.session.execute(
			text('SELECT DISTINCT dining_court FROM foods WHERE dining_court IS NOT NULL ORDER BY dining_court')
		)
		courts = [row[0] for row in result if row[0]]
		return jsonify(courts), 200
	except Exception as exc:
		return jsonify({'error': f'Failed to fetch dining courts: {exc}'}), 500


@app.route('/api/foods', methods=['GET'])
def get_foods():
	query = Food.query.order_by(Food.name.asc())
	search = request.args.get('q')
	if search:
		like = f"%{search.strip()}%"
		query = query.filter(Food.name.ilike(like))
	
	# Filter by dining court if specified
	dining_court = request.args.get('dining_court')
	if dining_court:
		query = query.filter(Food.dining_court == dining_court)
	
	# Filter by meal time if specified
	meal_time = request.args.get('meal_time')
	if meal_time:
		query = query.filter(Food.meal_time == meal_time)
	
	foods = query.all()
	return (
		jsonify([
			{
				'id': food.id,
				'name': food.name,
				'calories': food.calories,
				'macros': food.macros or {},
				'dining_court': food.dining_court,
				'station': food.station,
				'meal_time': food.meal_time,
				'next_available': food.next_available or [],
			}
			for food in foods
		]),
		200,
	)


@app.route('/api/foods', methods=['POST'])
@admin_required
def add_food():
	data = request.get_json() or {}

	required_fields = ['name', 'calories', 'macros']
	for field in required_fields:
		if field not in data:
			return jsonify({'error': f'Missing required field: {field}'}), 400

	macros = data.get('macros') or {}
	for macro_key in ('protein', 'carbs', 'fats'):
		if macro_key not in macros:
			return jsonify({'error': f"Macros must include '{macro_key}'"}), 400

	try:
		# Normalize meal_time if provided
		meal_time = data.get('meal_time')
		if meal_time:
			meal_time = meal_time.strip().lower().replace('_', ' ')
			if meal_time in ['late lunch', 'latelunch', 'late-lunch']:
				meal_time = 'late lunch'
			elif meal_time in ['breakfast']:
				meal_time = 'breakfast'
			elif meal_time in ['lunch']:
				meal_time = 'lunch'
			elif meal_time in ['dinner']:
				meal_time = 'dinner'
			# else leave as is

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
			meal_time=meal_time,
		)
		db.session.add(food)
		db.session.commit()
		return jsonify({
			'message': 'Food added successfully!',
			'food': {
				'id': food.id,
				'name': food.name,
				'calories': food.calories,
				'macros': food.macros,
				'dining_court': food.dining_court,
				'station': food.station,
			},
		}), 201
	except Exception as exc:  # pragma: no cover - defensive guard
		db.session.rollback()
		return jsonify({'error': f'Failed to add food: {exc}'}), 500


@app.route('/api/foods/<int:food_id>', methods=['DELETE'])
@admin_required
def delete_food(food_id: int):
	food = Food.query.get(food_id)
	if not food:
		return jsonify({'error': 'Food not found'}), 404
	try:
		db.session.delete(food)
		db.session.commit()
		return jsonify({'message': 'Food deleted'}), 200
	except Exception as exc:  # pragma: no cover
		db.session.rollback()
		return jsonify({'error': f'Failed to delete food: {exc}'}), 500


@app.route('/api/activities', methods=['GET'])
def get_activities():
	query = Activity.query.order_by(Activity.name.asc())
	search = request.args.get('q')
	if search:
		like = f"%{search.strip()}%"
		query = query.filter(Activity.name.ilike(like))
	activities = query.all()
	return (
		jsonify([
			{
				'id': activity.id,
				'name': activity.name,
				'calories_per_hour': activity.calories_per_hour,
			}
			for activity in activities
		]),
		200,
	)


@app.route('/api/activities', methods=['POST'])
@admin_required
def add_activity():
	data = request.get_json() or {}

	required_fields = ['name', 'calories_per_hour']
	for field in required_fields:
		if field not in data:
			return jsonify({'error': f'Missing required field: {field}'}), 400

	try:
		activity = Activity(
			name=str(data['name']).strip(),
			calories_per_hour=int(data['calories_per_hour']),
		)
		db.session.add(activity)
		db.session.commit()
		return jsonify({
			'message': 'Activity added successfully!',
			'activity': {
				'id': activity.id,
				'name': activity.name,
				'calories_per_hour': activity.calories_per_hour,
			},
		}), 201
	except Exception as exc:  # pragma: no cover - defensive guard
		db.session.rollback()
		return jsonify({'error': f'Failed to add activity: {exc}'}), 500


@app.route('/api/activities/<int:activity_id>', methods=['DELETE'])
@admin_required
def delete_activity(activity_id: int):
	activity = Activity.query.get(activity_id)
	if not activity:
		return jsonify({'error': 'Activity not found'}), 404
	try:
		db.session.delete(activity)
		db.session.commit()
		return jsonify({'message': 'Activity deleted'}), 200
	except Exception as exc:  # pragma: no cover
		db.session.rollback()
		return jsonify({'error': f'Failed to delete activity: {exc}'}), 500


@app.route('/health', methods=['GET'])
def health_check():
	return jsonify({'status': 'ok'}), 200


@app.route('/ready', methods=['GET'])
def ready_check():
	"""Liveness/Readiness: verifies DB connectivity with a simple query."""

	try:
		db.session.execute(text('SELECT 1'))
		return jsonify({'app': 'ok', 'db': 'ok'}), 200
	except Exception:
		return jsonify({'app': 'ok', 'db': 'error'}), 500


@app.route('/init-db', methods=['POST', 'GET'])
def init_database():
	"""Initialize database schema and seed data - run once after deployment."""

	try:
		db.create_all()

		existing_foods = Food.query.count()
		existing_activities = Activity.query.count()
		if existing_foods > 0 or existing_activities > 0:
			return (
				jsonify({'message': f'Database already initialized with {existing_foods} foods and {existing_activities} activities'}),
				200,
			)

		sample_foods = [
			{'name': 'Grilled Chicken Breast', 'calories': 165, 'macros': {'protein': 31, 'carbs': 0, 'fats': 3.6}},
			{'name': 'Brown Rice (1 cup)', 'calories': 216, 'macros': {'protein': 5, 'carbs': 45, 'fats': 1.8}},
			{'name': 'Broccoli (1 cup)', 'calories': 25, 'macros': {'protein': 3, 'carbs': 5, 'fats': 0.3}},
			{'name': 'Salmon Fillet', 'calories': 206, 'macros': {'protein': 22, 'carbs': 0, 'fats': 12}},
			{'name': 'Oatmeal (1 cup)', 'calories': 147, 'macros': {'protein': 6, 'carbs': 25, 'fats': 3}},
		]

		for food_data in sample_foods:
			food = Food(
				name=food_data['name'],
				calories=food_data['calories'],
				macros=food_data['macros'],
			)
			db.session.add(food)

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

		for activity_data in sample_activities:
			activity = Activity(
				name=activity_data['name'],
				calories_per_hour=activity_data['calories_per_hour'],
			)
			db.session.add(activity)

		db.session.commit()

		return jsonify({
			'message': 'Database initialized successfully!',
			'foods_added': len(sample_foods),
			'activities_added': len(sample_activities)
		}), 201
	except Exception as exc:  # pragma: no cover - defensive guard
		db.session.rollback()
		return jsonify({'error': f'Database initialization failed: {exc}'}), 500


import threading

# Global variable to track scraping status
scraping_status = {
	'in_progress': False,
	'last_result': None,
	'last_error': None
}

def run_scraper_background():
	"""Background function to run the scraper without blocking the HTTP request."""
	global scraping_status
	try:
		# Import scraper functions
		import sys
		import os
		scraper_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'scraper')
		if scraper_path not in sys.path:
			sys.path.insert(0, scraper_path)
		from scraper.menu_scraper import scrape_all_dining_courts

		with app.app_context():
			# Scrape menus with caching enabled
			items = scrape_all_dining_courts(use_cache=True)

			if not items:
				scraping_status['in_progress'] = False
				scraping_status['last_error'] = 'No menu items found'
				return

			# Save to database with smart updates
			added_count = 0
			updated_count = 0
			skipped_count = 0

			for item in items:
				# Skip items with no nutrition data
				if item['calories'] == 0 and item['protein'] == 0 and item['carbs'] == 0 and item['fats'] == 0:
					skipped_count += 1
					continue

				# Check if item already exists
				existing = Food.query.filter_by(
					name=item['name'],
					dining_court=item.get('dining_court')
				).first()

				if existing:
					# Update if existing item has no nutrition data
					if existing.calories == 0 and item['calories'] > 0:
						existing.calories = item['calories']
						existing.macros = {
							'protein': item['protein'],
							'carbs': item['carbs'],
							'fats': item['fats']
						}
						existing.station = item.get('station')
						updated_count += 1
					else:
						skipped_count += 1
				else:
					# Add new food item
					food = Food(
						name=item['name'],
						calories=item['calories'],
						macros={
							'protein': item['protein'],
							'carbs': item['carbs'],
							'fats': item['fats']
						},
						dining_court=item.get('dining_court'),
						station=item.get('station')
					)
					db.session.add(food)
					added_count += 1

			db.session.commit()

			scraping_status['in_progress'] = False
			scraping_status['last_result'] = {
				'items_added': added_count,
				'items_updated': updated_count,
				'items_skipped': skipped_count,
				'total_scraped': len(items)
			}
			scraping_status['last_error'] = None

	except Exception as exc:
		try:
			db.session.rollback()
		except Exception:
			pass
		scraping_status['in_progress'] = False
		scraping_status['last_error'] = str(exc)
		import traceback
		traceback.print_exc()
@app.route('/api/scrape-menus', methods=['POST'])
@admin_required
def scrape_menus():
	"""Start scraping Purdue dining court menus in the background."""
	global scraping_status
	
	if scraping_status['in_progress']:
		return jsonify({'error': 'Scraping already in progress'}), 409
	
	# Start scraping in background thread
	scraping_status['in_progress'] = True
	scraping_status['last_result'] = None
	scraping_status['last_error'] = None
	
	thread = threading.Thread(target=run_scraper_background, daemon=True)
	thread.start()
	
	return jsonify({
		'message': 'Scraping started in background. Check /api/scrape-status for progress.'
	}), 202

@app.route('/api/scrape-status', methods=['GET'])
@admin_required
def scrape_status():
	"""Check the status of the scraping operation."""
	global scraping_status
	
	if scraping_status['in_progress']:
		return jsonify({
			'status': 'in_progress',
			'message': 'Scraping is currently running...'
		}), 200
	elif scraping_status['last_error']:
		return jsonify({
			'status': 'error',
			'error': scraping_status['last_error']
		}), 500
	elif scraping_status['last_result']:
		result = scraping_status['last_result']
		message = f"Menu scraping complete! Added {result['items_added']} new items"
		if result['items_updated'] > 0:
			message += f", updated {result['items_updated']} items"
		
		return jsonify({
			'status': 'complete',
			'message': message,
			**result
		}), 200
	else:
		return jsonify({
			'status': 'idle',
			'message': 'No scraping operation has been run yet'
		}), 200

@app.route('/api/scrape-menus-sync', methods=['POST'])
@admin_required
def scrape_menus_sync():
	"""Scrape Purdue dining court menus synchronously (original blocking version)."""
	try:
		# Import scraper functions
		import sys
		import os
		scraper_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'scraper')
		if scraper_path not in sys.path:
			sys.path.insert(0, scraper_path)
		from scraper.menu_scraper import scrape_all_dining_courts

		# Scrape menus with caching enabled
		items = scrape_all_dining_courts(use_cache=True)

		if not items:
			return jsonify({'error': 'No menu items found'}), 404

		# Save to database with smart updates
		added_count = 0
		updated_count = 0
		skipped_count = 0

		for item in items:
			# Skip items with no nutrition data
			if item['calories'] == 0 and item['protein'] == 0 and item['carbs'] == 0 and item['fats'] == 0:
				skipped_count += 1
				continue

			# Check if item already exists
			existing = Food.query.filter_by(
				name=item['name'],
				dining_court=item.get('dining_court')
			).first()

			if existing:
				# Update if existing item has no nutrition data
				if existing.calories == 0 and item['calories'] > 0:
					existing.calories = item['calories']
					existing.macros = {
						'protein': item['protein'],
						'carbs': item['carbs'],
						'fats': item['fats']
					}
					existing.station = item.get('station')
					updated_count += 1
				else:
					skipped_count += 1
			else:
				# Add new food item
				food = Food(
					name=item['name'],
					calories=item['calories'],
					macros={
						'protein': item['protein'],
						'carbs': item['carbs'],
						'fats': item['fats']
					},
					dining_court=item.get('dining_court'),
					station=item.get('station')
				)
				db.session.add(food)
				added_count += 1

		db.session.commit()

		message = f'Menu scraping complete! Added {added_count} new items'
		if updated_count > 0:
			message += f', updated {updated_count} items'

		return jsonify({
			'message': message,
			'items_added': added_count,
			'items_updated': updated_count,
			'items_skipped': skipped_count,
			'total_scraped': len(items)
		}), 201

	except Exception as exc:
		db.session.rollback()
		import traceback
		error_details = traceback.format_exc()
		print(f"Scraping error: {error_details}")
		return jsonify({'error': f'Scraping failed: {str(exc)}'}), 500


@app.route('/api/admin/clear-placeholders', methods=['DELETE'])
@admin_required
def clear_placeholders():
	"""Delete placeholder/test food items (items without a dining_court)."""
	try:
		# Find and delete foods without a dining_court
		placeholders = Food.query.filter_by(dining_court=None).all()
		count = len(placeholders)
		
		for food in placeholders:
			db.session.delete(food)
		
		db.session.commit()
		
		return jsonify({
			'message': f'Successfully deleted {count} placeholder items',
			'deleted_count': count
		}), 200
		
	except Exception as exc:
		db.session.rollback()
		return jsonify({'error': f'Failed to delete placeholders: {str(exc)}'}), 500


if __name__ == '__main__':
	app.run(debug=True)
