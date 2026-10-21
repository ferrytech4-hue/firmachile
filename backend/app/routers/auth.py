import uuid
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ..database import get_db
from ..config import settings
from ..models import User, Membership, Tenant
from ..schemas import LoginRequest, TokenResponse
from ..security import verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Autenticación y Sesiones"])

@router.post("/login", response_model=TokenResponse)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Inicio de sesión seguro para usuarios de FirmaDigital Chile.
    Emite un token JWT que contiene el user_id y tenant_id autorizado.
    """
    user = db.query(User).filter(User.email == form_data.username.lower()).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo electrónico o contraseña incorrecta.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.activo:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cuenta desactivada.")

    # Obtener membresía predeterminada
    membership = db.query(Membership).filter(Membership.user_id == user.id, Membership.activo == True).first()
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El usuario no tiene membresías activas en ninguna empresa.",
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id, "tenant_id": membership.tenant_id, "role": membership.role.value},
        expires_delta=access_token_expires,
    )

    return TokenResponse(
        access_token=access_token,
        tenant_id=membership.tenant_id,
        role=membership.role.value,
        user_name=user.nombre_completo,
        user_rut=user.rut,
    )
