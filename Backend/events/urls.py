from django.urls import path
from .views import CalendarEventListView, AnnouncementListView, UserPreferenceView, LinkListView, HybridSearchView, FeedbackPostListCreateView

app_name = 'events'

urlpatterns = [
    path('calendar/', CalendarEventListView.as_view(), name='calendar-list'),
    path('announcements/', AnnouncementListView.as_view(), name='announcement-list'),
    path('preferences/', UserPreferenceView.as_view(), name='user-preferences'),
    path('links/', LinkListView.as_view(), name='api-link-list'),
    path('search/', HybridSearchView.as_view(), name='links-search'),
    path('feedback/', FeedbackPostListCreateView.as_view(), name='feedback-list-create'),
]
