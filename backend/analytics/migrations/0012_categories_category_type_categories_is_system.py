# Generated by Django 5.1.5 on 2025-06-06 00:41

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('analytics', '0011_categories_is_active'),
    ]

    operations = [
        migrations.AddField(
            model_name='categories',
            name='category_type',
            field=models.CharField(default='study', max_length=20),
        ),
        migrations.AddField(
            model_name='categories',
            name='is_system',
            field=models.BooleanField(default=False),
        ),
    ]
