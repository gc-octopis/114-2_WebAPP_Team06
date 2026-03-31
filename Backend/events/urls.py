from django.urls import path
from .views import CalendarEventListView, AnnouncementListView, UserPreferenceView

app_name = 'events'

urlpatterns = [
    path('calendar/', CalendarEventListView.as_view(), name='calendar-list'),
    path('announcements/', AnnouncementListView.as_view(), name='announcement-list'),
    path('preferences/', UserPreferenceView.as_view(), name='user-preferences'),
]
