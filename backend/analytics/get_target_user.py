
from django.contrib.auth.models import AbstractUser

def get_target_user(request):
    """Get the target user based on request parameters and permissions"""
    requesting_user = request.user
    target_username = request.query_params.get('username')
    
    # If no username specified, use the requesting user
    if not target_username:
        return requesting_user
        
    # If requesting user is admin, allow access to any user
    if requesting_user.is_staff:
        try:
            return CustomUser.objects.get(username=target_username)
        except CustomUser.DoesNotExist:
            return None
            
    # If requesting user is not admin, only allow access to their own data
    if target_username == requesting_user.username:
        return requesting_user
    return None