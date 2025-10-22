from django.db import models
from django.utils import timezone
from django.contrib.postgres.fields import JSONField as PGJSONField

try:
    from django.db.models import JSONField  # Django 3.1+
except Exception:  # pragma: no cover
    JSONField = PGJSONField


class Food(models.Model):
    name = models.CharField(max_length=255)
    calories = models.IntegerField()
    macros = JSONField(default=dict)
    dining_court = models.CharField(max_length=100, blank=True, null=True)
    station = models.CharField(max_length=255, blank=True, null=True)
    meal_time = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'foods'
        indexes = [
            models.Index(fields=['dining_court'], name='idx_foods_dining_court')
        ]


class Activity(models.Model):
    name = models.CharField(max_length=255)
    calories_per_hour = models.IntegerField()
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'activities'
