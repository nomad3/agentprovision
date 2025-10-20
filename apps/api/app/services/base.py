from sqlalchemy.orm import Session

from app.core.security import verify_password
from app.models.user import User

def authenticate_user(
    db: Session, *, email: str, password: str
) -> User | None:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user
