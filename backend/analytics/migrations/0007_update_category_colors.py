from django.db import migrations

def update_category_colors(apps, schema_editor):
    Categories = apps.get_model('analytics', 'Categories')
    color_mapping = {
        'Mathematics': '#FF6B6B',  # Coral Red
        'Computer Science': '#4ECDC4',  # Turquoise
        'Physics': '#45B7D1',  # Sky Blue
        'Literature': '#96CEB4',  # Sage Green
        'History': '#FFEEAD',  # Cream
        'Chemistry': '#FFD93D',  # Golden Yellow
        'Biology': '#6C5B7B'  # Muted Purple
    }
    
    for category_name, color in color_mapping.items():
        Categories.objects.filter(name=category_name).update(color=color)

def reverse_category_colors(apps, schema_editor):
    Categories = apps.get_model('analytics', 'Categories')
    Categories.objects.all().update(color='#000000')

class Migration(migrations.Migration):
    dependencies = [
        ('analytics', '0006_usergoals'),
    ]

    operations = [
        migrations.RunPython(update_category_colors, reverse_category_colors),
    ] 