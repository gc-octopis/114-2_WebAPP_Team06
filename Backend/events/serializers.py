from rest_framework import serializers
from django.utils import timezone
from zoneinfo import ZoneInfo
from .models import CalendarEvent, Announcement, LinkCategory, LinkItem, FeedbackPost, ContactMessage


class CalendarEventSerializer(serializers.ModelSerializer):
    dateStart = serializers.SerializerMethodField()
    dateEnd = serializers.SerializerMethodField()

    class Meta:
        model = CalendarEvent
        fields = ['id', 'summary', 'dateStart', 'dateEnd', 'location', 'description']

    def get_dateStart(self, obj):
        return obj.date_start.isoformat()

    def get_dateEnd(self, obj):
        return obj.date_end.isoformat() if obj.date_end else None


class AnnouncementSerializer(serializers.ModelSerializer):
    date = serializers.DateField(format='%Y-%m-%d')

    class Meta:
        model = Announcement
        fields = ['category', 'unit', 'title', 'date', 'link']

class LinkItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = LinkItem
        fields = ['label', 'label_en', 'url', 'url_en', 'icon']

class LinkCategorySerializer(serializers.ModelSerializer):
    # 'links' matches the related_name we defined in the models.py
    links = LinkItemSerializer(many=True, read_only=True)
    
    # Map the database 'slug' field to 'id' to match the frontend JSON structure
    id = serializers.CharField(source='slug', read_only=True)

    class Meta:
        model = LinkCategory
        fields = ['id', 'icon', 'label', 'label_en', 'links']


class FeedbackPostSerializer(serializers.ModelSerializer):
    created_at = serializers.SerializerMethodField()
    parent_id = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()

    def get_created_at(self, obj):
        local_dt = timezone.localtime(obj.created_at, ZoneInfo('Asia/Taipei'))
        return local_dt.strftime('%Y-%m-%d %I:%M %p').lower()

    def get_parent_id(self, obj):
        return obj.parent_id

    def get_replies(self, obj):
        children = obj.replies.all().order_by('created_at', 'id')
        return FeedbackPostSerializer(children, many=True).data

    class Meta:
        model = FeedbackPost
        fields = ['id', 'parent_id', 'nickname', 'avatar_color', 'content', 'created_at', 'replies']


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ['name', 'email', 'message']