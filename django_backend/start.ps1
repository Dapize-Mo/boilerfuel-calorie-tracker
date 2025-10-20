# Launch Django backend on port 5000 to match existing frontend default
$env:PORT = "5000"
python .\django_backend\manage.py runserver 0.0.0.0:5000
