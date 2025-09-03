from fastapi import APIRouter, HTTPException
from app.utils import create_access_token
from app.models import users_collection
from bson.objectid import ObjectId
from passlib.context import CryptContext

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Signup
@router.post("/signup")
def signup(username: str, password: str, role: str = "user"):
    if users_collection.find_one({"username": username}):
        raise HTTPException(status_code=400, detail="User already exists")
    
    hashed_pw = pwd_context.hash(password)
    user = {"username": username, "password": hashed_pw, "role": role}
    result = users_collection.insert_one(user)
    return {"id": str(result.inserted_id), "username": username, "role": role}

# Login
@router.post("/login")
def login(username: str, password: str):
    user = users_collection.find_one({"username": username})
    if not user or not pwd_context.verify(password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": username})
    return {"access_token": token, "token_type": "bearer"}
