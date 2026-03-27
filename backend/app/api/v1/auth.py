from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.models.employer import User
from app.schemas.user import UserCreate, UserResponse, UserLogin
from passlib.context import CryptContext
import passlib.handlers.bcrypt

# This monkey-patch is necessary to support bcrypt >= 4.0.0 with passlib 1.7.4.
# passlib has an internal check (detect_wrap_bug) that uses a password > 72 chars,
# which triggers a ValueError in newer bcrypt versions.
import passlib.handlers.bcrypt
if hasattr(passlib.handlers.bcrypt, 'detect_wrap_bug'):
    # Avoid the broken internal bug check during initialization
    passlib.handlers.bcrypt.detect_wrap_bug = lambda x: False

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def truncate_pwd(password: str) -> str:
    # Bcrypt has a 72-byte limit. We truncate to ensure compat with bcrypt >= 4.0.0.
    pwd_bytes = password.encode('utf-8')
    if len(pwd_bytes) > 72:
        # Truncate to 72 bytes and decode back to string, ignoring partial characters
        return pwd_bytes[:72].decode('utf-8', errors='ignore')
    return password

@router.post("/signup", response_model=UserResponse)
def signup(user_in: UserCreate, db: Session = Depends(get_db)):
    # ... previous signup logic ...
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists in the system",
        )
    
    hashed_password = pwd_context.hash(truncate_pwd(user_in.password))
    
    db_user = User(
        name=user_in.name,
        email=user_in.email,
        role=user_in.role,
        password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/login", response_model=UserResponse)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    if not pwd_context.verify(truncate_pwd(user_in.password), user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password",
        )
    
    return user
