from .models import Categories, CustomUser

def ensure_break_category(user):
    """Ensure user has a break category, create if missing"""
    break_category = Categories.objects.filter(
        user=user, 
        is_system=True, 
        category_type='break'
    ).first()
    
    if not break_category:
        break_category = Categories.objects.create(
            user=user,
            name="Break",
            color="#808080",  # Gray color
            is_active=True,
            is_system=True,
            category_type='break'
        )
        print(f"Created break category for user {user.username}")
    
    return break_category

def get_break_category(user):
    """Get the break category for a user"""
    return Categories.objects.filter(
        user=user, 
        is_system=True, 
        category_type='break'
    ).first() 