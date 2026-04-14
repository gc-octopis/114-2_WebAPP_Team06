from django.tasks import task
from django.core.mail import send_mail
from dotenv import load_dotenv
import os

load_dotenv()

@task()
def send_email_task(user_email, subject, content):
    send_mail(
        subject,
        content,
        f"MyNTU++ <{os.getenv("EMAIL_HOST_USER")}@ntu.edu.tw>",
        [user_email],
    )