import datetime
from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from .config import settings
from .database import get_db, set_tenant_context
from .models import User, Membership, Tenant, RoleEnum

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

class CurrentTenantContext:
    def __init__(self, tenant: Tenant, user: User, membership: Membership):
        self.tenant = tenant
        self.user = user
        self.membership = membership
        self.tenant_id = tenant.id
        self.role = membership.role

def get_current_tenant_context(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> CurrentTenantContext:
    """
    CRÍTICO: Obtiene la empresa activa EXCLUSIVAMENTE a partir del token JWT firmado.
    Nunca confía en encabezados 'X-Tenant-Id' arbitrarios enviados por el cliente.
    Configura el contexto RLS de PostgreSQL para la conexión actual.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales de autenticación no válidas o expiradas.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        tenant_id: str = payload.get("tenant_id")
        if user_id is None or tenant_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id, User.activo == True).first()
    if user is None:
        raise credentials_exception

    # Validar membresía activa dentro de la empresa
    membership = (
        db.query(Membership)
        .filter(
            Membership.user_id == user.id,
            Membership.tenant_id == tenant_id,
            Membership.activo == True,
        )
        .first()
    )
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No posee membresía ni autorización activa para la empresa solicitada.",
        )

    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La empresa especificada no existe.",
        )

    # Activar RLS en la sesión PostgreSQL
    set_tenant_context(db, tenant.id)

    return CurrentTenantContext(tenant=tenant, user=user, membership=membership)

def require_roles(allowed_roles: List[RoleEnum]):
    """Dependencia para control de acceso basado en roles (RBAC)"""
    def role_checker(ctx: CurrentTenantContext = Depends(get_current_tenant_context)) -> CurrentTenantContext:
        if ctx.membership.role not in allowed_roles and ctx.membership.role != RoleEnum.SUPERADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permiso insuficiente. Requiere uno de los siguientes roles: {[r.value for r in allowed_roles]}",
            )
        return ctx
    return role_checker
