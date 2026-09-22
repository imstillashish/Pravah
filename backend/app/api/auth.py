from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import jwt
from app.database import get_db
from app.models import User
from app.security import hash_password, verify_password, create_access_token, decode_access_token
from app.schemas import UserSignup, UserLogin, RoleSwitchRequest, UserResponse, TokenResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    try:
        payload = decode_access_token(token)
        email: str = payload.get("sub")
        if not email:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Your session expired. Please sign in again.")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Your session expired. Please sign in again.")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Account not found. Please sign in again.")
    return user

@router.post("/signup", response_model=TokenResponse)
def signup(payload: UserSignup, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="An account with this email address already exists. Try signing in instead.")
    if len(payload.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long.")
    
    role = payload.role if payload.role in ["logistics_planner", "port_operator"] else "logistics_planner"
    user = User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
        role=role
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.email, "role": user.role})
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))

@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="The email or password you entered didn't match. Please try again.")
    
    token = create_access_token({"sub": user.email, "role": user.role})
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)

@router.post("/switch-role", response_model=TokenResponse)
def switch_role(req: RoleSwitchRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if req.target_role not in ["logistics_planner", "port_operator"]:
        raise HTTPException(status_code=400, detail="Invalid workspace role requested.")
    current_user.role = req.target_role
    db.commit()
    db.refresh(current_user)

    token = create_access_token({"sub": current_user.email, "role": current_user.role})
    return TokenResponse(access_token=token, user=UserResponse.model_validate(current_user))
