from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('events', '0005_linkcategory_linkitem'),
    ]

    operations = [
        migrations.CreateModel(
            name='FeedbackPost',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nickname', models.CharField(blank=True, default='Anonymous', max_length=80)),
                ('title', models.CharField(max_length=200)),
                ('content', models.TextField(max_length=3000)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
            ],
            options={
                'verbose_name': 'Feedback Post',
                'verbose_name_plural': 'Feedback Posts',
                'ordering': ['-created_at', '-id'],
            },
        ),
    ]
