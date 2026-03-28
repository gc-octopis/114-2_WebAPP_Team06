from django.urls import path
from .views import CalendarEventListView, AnnouncementListView

app_name = 'events'

urlpatterns = [
    path('calendar/', CalendarEventListView.as_view(), name='calendar-list'),
    path('announcements/', AnnouncementListView.as_view(), name='announcement-list'),
]
