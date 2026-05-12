from django.urls import path
from .views import CalendarEventListView, AnnouncementListView, UserPreferenceView, LinkListView, HybridSearchView, FeedbackPostListCreateView, ContactMessageCreateView
from .views import RegisterView, LoginView, LogoutView, CurrentUserView, ProfileView

app_name = 'events'

urlpatterns = [
    path('calendar/', CalendarEventListView.as_view(), name='calendar-list'),
    path('announcements/', AnnouncementListView.as_view(), name='announcement-list'),
    path('preferences/', UserPreferenceView.as_view(), name='user-preferences'),
    path('links/', LinkListView.as_view(), name='api-link-list'),
    path('search/', HybridSearchView.as_view(), name='links-search'),
    path('feedback/', FeedbackPostListCreateView.as_view(), name='feedback-list-create'),
    path('contact/', ContactMessageCreateView.as_view(), name='contact-create'),
    # auth
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/logout/', LogoutView.as_view(), name='auth-logout'),
    path('auth/me/', CurrentUserView.as_view(), name='auth-me'),
    path('auth/profile/', ProfileView.as_view(), name='auth-profile'),
]

