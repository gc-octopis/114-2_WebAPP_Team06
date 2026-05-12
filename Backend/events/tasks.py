try:
    from django.tasks import task
except ImportError:
    def task(*args, **kwargs):
        def _decorator(func):
            return func
        return _decorator
from django.core.mail import send_mail
from dotenv import load_dotenv
import os

load_dotenv()

@task()
def send_email_task(user_email, subject, content):
    host_user = os.getenv('EMAIL_HOST_USER') or ''
    send_mail(
        subject,
        content,
        f"MyNTU++ <{host_user}@ntu.edu.tw>",
        [user_email],
    )