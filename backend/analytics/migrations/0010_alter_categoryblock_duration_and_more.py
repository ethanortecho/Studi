# Generated by Django 5.1.5 on 2025-05-22 02:16

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('analytics', '0009_rename_studysessionbreakdown_categoryblock'),
    ]

    operations = [
        migrations.AlterField(
            model_name='categoryblock',
            name='duration',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='categoryblock',
            name='end_time',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
