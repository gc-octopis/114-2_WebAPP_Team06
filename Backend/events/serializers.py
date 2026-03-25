from rest_framework import serializers
from .models import CalendarEvent


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
