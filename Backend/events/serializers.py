from rest_framework import serializers
from .models import CalendarEvent, Announcement, LinkCategory, LinkItem


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
        fields = ['label', 'label_en', 'url', 'icon']

class LinkCategorySerializer(serializers.ModelSerializer):
    # 'links' matches the related_name we defined in the models.py
    links = LinkItemSerializer(many=True, read_only=True)
    
    # Map the database 'slug' field to 'id' to match the frontend JSON structure
    id = serializers.CharField(source='slug', read_only=True)

    class Meta:
        model = LinkCategory
        fields = ['id', 'icon', 'label', 'label_en', 'links']