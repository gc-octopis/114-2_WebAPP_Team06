from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('events', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Announcement',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('language', models.CharField(choices=[('zh', '中文'), ('en', 'English')], db_index=True, default='zh', max_length=2)),
                ('category', models.CharField(blank=True, default='', max_length=120)),
                ('unit', models.CharField(blank=True, default='', max_length=255)),
                ('title', models.CharField(max_length=500)),
                ('date', models.DateField(db_index=True)),
                ('link', models.URLField(max_length=1000)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Announcement',
                'verbose_name_plural': 'Announcements',
                'ordering': ['-date', '-id'],
            },
        ),
        migrations.AddIndex(
            model_name='announcement',
            index=models.Index(fields=['language', 'date'], name='events_anno_languag_d5eb96_idx'),
        ),
        migrations.AddIndex(
            model_name='announcement',
            index=models.Index(fields=['language', 'category'], name='events_anno_languag_9caad8_idx'),
        ),
        migrations.AddConstraint(
            model_name='announcement',
            constraint=models.UniqueConstraint(fields=('language', 'link'), name='uniq_announcement_lang_link'),
        ),
    ]
