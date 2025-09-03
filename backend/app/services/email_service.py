import requests
from app.config import EMAIL_API_KEY

def send_email(to: str, subject: str, content: str):
    url = "https://api.resend.com/email"
    headers = {"Authorization": f"Bearer {EMAIL_API_KEY}", "Content-Type": "application/json"}
    data = {
        "from": "support@yourchatbot.com",
        "to": to,
        "subject": subject,
        "text": content
    }
    response = requests.post(url, json=data, headers=headers)
    return response.json()
