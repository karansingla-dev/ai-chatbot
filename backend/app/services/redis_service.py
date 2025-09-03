import redis
from app.config import REDIS_HOST, REDIS_PORT

r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)

def save_message(user: str, msg: str):
    r.lpush("chat_history", f"{user}: {msg}")

def get_messages(limit=10):
    return r.lrange("chat_history", 0, limit-1)
