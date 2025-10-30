# Generated migration for expanded Activity model
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='activity',
            name='category',
            field=models.CharField(
                choices=[
                    ('cardio', 'Cardio'),
                    ('strength', 'Strength'),
                    ('flexibility', 'Flexibility'),
                    ('sports', 'Sports'),
                    ('other', 'Other'),
                ],
                default='other',
                max_length=50
            ),
        ),
        migrations.AddField(
            model_name='activity',
            name='intensity',
            field=models.CharField(
                choices=[
                    ('light', 'Light'),
                    ('moderate', 'Moderate'),
                    ('vigorous', 'Vigorous'),
                ],
                default='moderate',
                max_length=50
            ),
        ),
        migrations.AddField(
            model_name='activity',
            name='muscle_groups',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name='activity',
            name='equipment',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='activity',
            name='description',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddIndex(
            model_name='activity',
            index=models.Index(fields=['category'], name='idx_activities_category'),
        ),
    ]
