from django.urls import path
from .views import CalendarEventListView

app_name = 'events'

urlpatterns = [
    path('calendar/', CalendarEventListView.as_view(), name='calendar-list'),
]
