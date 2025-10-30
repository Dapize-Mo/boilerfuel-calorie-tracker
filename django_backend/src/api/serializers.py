from rest_framework import serializers
from .models import Food, Activity

class FoodSerializer(serializers.ModelSerializer):
    class Meta:
        model = Food
        fields = ['id', 'name', 'calories', 'macros', 'dining_court', 'station', 'meal_time']

class ActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Activity
        fields = ['id', 'name', 'calories_per_hour', 'category', 'intensity', 'muscle_groups', 'equipment', 'description']
