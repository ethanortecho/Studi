# Generated by Django 5.1.5 on 2025-05-16 02:58

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('analytics', '0006_usergoals'),
    ]

    operations = [
        migrations.AddField(
            model_name='studysession',
            name='status',
            field=models.CharField(choices=[('active', 'Active'), ('completed', 'Completed'), ('cancelled', 'Cancelled'), ('paused', 'Paused'), ('interrupted', 'Interrupted')], default='active', max_length=50),
        ),
    ]
