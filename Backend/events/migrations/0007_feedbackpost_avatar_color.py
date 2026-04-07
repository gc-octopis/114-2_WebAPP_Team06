from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('events', '0006_feedbackpost'),
    ]

    operations = [
        migrations.AddField(
            model_name='feedbackpost',
            name='avatar_color',
            field=models.CharField(default='#94a3b8', max_length=7),
        ),
    ]
