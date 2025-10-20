from django.urls import path
from . import views

urlpatterns = [
    path('health', views.health_check),
    path('ready', views.ready_check),
    path('init-db', views.init_database),

    path('api/admin/login', views.admin_login),
    path('api/admin/session', views.admin_session),

    path('api/dining-courts', views.get_dining_courts),

    path('api/foods', views.foods_list_create),
    path('api/foods/<int:food_id>', views.foods_delete),

    path('api/activities', views.activities_list_create),
    path('api/activities/<int:activity_id>', views.activities_delete),

    path('api/scrape-menus', views.scrape_menus),
    path('api/scrape-status', views.scrape_status),
    path('api/scrape-menus-sync', views.scrape_menus_sync),

    path('api/admin/clear-placeholders', views.clear_placeholders),
]
