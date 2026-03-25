"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def health_check(request):
    """Health check endpoint"""
    return JsonResponse({
        'status': 'ok',
        'message': 'MyNTU++ Backend API',
        'api_endpoints': {
            'calendar': '/api/calendar/?lang=zh|en',
            'documentation': 'See CALENDAR_MIGRATION.md for API details'
        }
    })

urlpatterns = [
    path('', health_check, name='health-check'),
    path('admin/', admin.site.urls),
    path('api/', include('events.urls')),
]
