from django.contrib import admin
from .models import ContactMessage


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'short_message', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('name', 'email', 'message')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)

    def short_message(self, obj):
        return obj.message[:80] + '...' if len(obj.message) > 80 else obj.message
    short_message.short_description = 'Message'
