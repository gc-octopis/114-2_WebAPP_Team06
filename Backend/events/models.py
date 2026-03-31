from django.db import models


class CalendarEvent(models.Model):
    """
    Academic calendar event for both Chinese and English versions.
    """
    LANGUAGE_CHOICES = [
        ('zh', '中文'),
        ('en', 'English'),
    ]

    # 基本信息
    language = models.CharField(max_length=2, choices=LANGUAGE_CHOICES, default='zh', db_index=True)
    summary = models.CharField(max_length=500, help_text="Event title/name")
    
    # 日期信息
    date_start = models.DateField(db_index=True, help_text="Event start date")
    date_end = models.DateField(blank=True, null=True, help_text="Event end date")
    
    # 額外資料（可選）
    location = models.CharField(max_length=500, blank=True, default='', help_text="Event location")
    description = models.TextField(blank=True, default='', help_text="Event description")
    
    # 系統欄位
    uid = models.CharField(max_length=255, unique=True, db_index=True, help_text="Unique identifier from ICS")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['language', 'date_start']),
            models.Index(fields=['date_start', 'date_end']),
        ]
        ordering = ['date_start']
        verbose_name = 'Calendar Event'
        verbose_name_plural = 'Calendar Events'

    def __str__(self):
        return f"[{self.get_language_display()}] {self.summary} ({self.date_start})"

    def to_dict(self):
        """Convert to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'summary': self.summary,
            'dateStart': self.date_start.isoformat(),
            'dateEnd': self.date_end.isoformat() if self.date_end else None,
            'location': self.location,
            'description': self.description,
        }


class Announcement(models.Model):
    """Announcement item scraped from NTU announcement pages."""
    LANGUAGE_CHOICES = [
        ('zh', '中文'),
        ('en', 'English'),
    ]

    language = models.CharField(max_length=2, choices=LANGUAGE_CHOICES, default='zh', db_index=True)
    category = models.CharField(max_length=120, blank=True, default='')
    unit = models.CharField(max_length=255, blank=True, default='')
    title = models.CharField(max_length=500)
    date = models.DateField(db_index=True)
    link = models.URLField(max_length=1000)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['language', 'date']),
            models.Index(fields=['language', 'category']),
        ]
        ordering = ['-date', '-id']
        constraints = [
            models.UniqueConstraint(fields=['language', 'link'], name='uniq_announcement_lang_link'),
        ]

    def __str__(self):
        return f"[{self.language}] {self.title} ({self.date})"


class UserPreference(models.Model):
    """Store user preferences based on a generated device UUID or user ID."""
    user_id = models.CharField(max_length=255, unique=True, db_index=True)
    pinned_links = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'User Preference'
        verbose_name_plural = 'User Preferences'

    def __str__(self):
        return f"Preferences for {self.user_id}"

class LinkCategory(models.Model):
    slug = models.CharField(max_length=50, unique=True) # e.g., 'teaching', 'library'
    icon = models.CharField(max_length=10)
    label = models.CharField(max_length=100)
    label_en = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"{self.label} ({self.slug})"

class LinkItem(models.Model):
    category = models.ForeignKey(LinkCategory, related_name='links', on_delete=models.CASCADE)
    label = models.CharField(max_length=200)
    label_en = models.CharField(max_length=200, blank=True, null=True)
    url = models.URLField(max_length=500)
    icon = models.URLField(max_length=500)
    
    # Store the vector embedding as a JSON list of floats
    embedding = models.JSONField(blank=True, null=True)

    def __str__(self):
        return self.label
