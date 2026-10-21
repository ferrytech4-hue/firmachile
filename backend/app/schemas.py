from typing import List, Optional, Any, Dict
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, field_validator
from .rut_validator import validate_rut, format_rut
from .models import RoleEnum, SignatureTypeEnum, DocumentStatusEnum, DocumentCategoryEnum

# --- RUT SCHEMA HELPER ---
class RutField(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not isinstance(v, str) or not validate_rut(v):
            raise ValueError(f"El RUT '{v}' no es un RUT chileno válido según Módulo 11.")
        return format_rut(v)

# --- AUTH SCHEMAS ---
class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    tenant_id: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    tenant_id: str
    role: str
    user_name: str
    user_rut: str

# --- TENANT SCHEMAS ---
class TenantBase(BaseModel):
    rut: str
    razon_social: str
    nombre_fantasia: str
    giro: str
    direccion: str
    comuna: str
    region: str
    telefono: str
    email_contacto: EmailStr
    plan_id: str = "empresa"

    @field_validator("rut")
    @classmethod
    def check_rut(cls, v: str) -> str:
        if not validate_rut(v):
            raise ValueError(f"RUT de empresa '{v}' inválido.")
        return format_rut(v)

class TenantCreate(TenantBase):
    pass

class TenantOut(TenantBase):
    id: str
    estado_suscripcion: str
    limite_documentos_mes: int
    documentos_consumidos_mes: int
    limite_almacenamiento_mb: int
    almacenamiento_usado_mb: int
    limite_usuarios: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- WORKER SCHEMAS ---
class WorkerBase(BaseModel):
    rut: str
    nombres: str
    apellidos: str
    email: EmailStr
    telefono: str
    cargo: str
    faena_ubicacion: str
    fecha_ingreso: str
    afp: Optional[str] = "Modelo"
    salud: Optional[str] = "Fonasa"

    @field_validator("rut")
    @classmethod
    def check_rut(cls, v: str) -> str:
        if not validate_rut(v):
            raise ValueError(f"RUT de trabajador '{v}' inválido.")
        return format_rut(v)

class WorkerCreate(WorkerBase):
    pass

class WorkerOut(WorkerBase):
    id: str
    tenant_id: str
    estado: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- SIGNER & DOCUMENT SCHEMAS ---
class SignerIn(BaseModel):
    rut: str
    nombre_completo: str
    email: EmailStr
    cargo: str
    orden_firma: int = 1
    worker_id: Optional[str] = None

    @field_validator("rut")
    @classmethod
    def check_rut(cls, v: str) -> str:
        if not validate_rut(v):
            raise ValueError(f"RUT de firmante '{v}' inválido.")
        return format_rut(v)

class SignerOut(SignerIn):
    id: str
    estado: str
    fecha_firma_utc: Optional[datetime] = None
    fecha_firma_clt: Optional[str] = None
    ip_address: Optional[str] = None
    cedula_serie: Optional[str] = None

    class Config:
        from_attributes = True

class DocumentCreate(BaseModel):
    titulo: str
    categoria: DocumentCategoryEnum
    tipo_firma: SignatureTypeEnum = SignatureTypeEnum.SIMPLE
    contenido_texto: Optional[str] = None
    nombre_archivo: Optional[str] = "documento.pdf"
    trabajador_destinatario_id: Optional[str] = None
    firmantes: List[SignerIn]
    dias_vencimiento: int = 15

class DocumentOut(BaseModel):
    id: str
    tenant_id: str
    titulo: str
    categoria: DocumentCategoryEnum
    tipo_firma_requerida: SignatureTypeEnum
    estado: DocumentStatusEnum
    version: int
    hash_sha256: str
    nombre_archivo: str
    creado_por_nombre: str
    fecha_creacion: datetime
    fecha_vencimiento: datetime
    fecha_completado: Optional[datetime] = None
    firmantes: List[SignerOut] = []

    class Config:
        from_attributes = True

# --- SIGNATURE WORKFLOW SCHEMAS ---
class SignAcceptRequest(BaseModel):
    consent_acknowledged: bool
    cedula_serie: Optional[str] = None
    firma_data_url: Optional[str] = None
    otp_code: Optional[str] = None

class SignRejectRequest(BaseModel):
    motivo_rechazo: str

# --- EPP & ASSETS SCHEMAS ---
class AssetCreate(BaseModel):
    codigo_inventario: str
    nombre: str
    marca: str
    modelo: str
    numero_serie: str
    valor_estimado_clp: float = 0.0
    observaciones: Optional[str] = None

class AssetOut(AssetCreate):
    id: str
    tenant_id: str
    estado: str
    created_at: datetime

    class Config:
        from_attributes = True

class EppItemSchema(BaseModel):
    nombre: str
    tipo: str
    marca: str
    modelo_talla: str
    certificacion_norma: str
    cantidad: int = 1
    estado: str = "nuevo"

class EppDeliveryCreate(BaseModel):
    worker_id: str
    supervisor_responsable: str
    faena_ubicacion: str
    fecha_entrega: str
    items: List[EppItemSchema]
    observaciones: Optional[str] = None

class EppDeliveryOut(BaseModel):
    id: str
    tenant_id: str
    worker_id: str
    supervisor_responsable: str
    faena_ubicacion: str
    fecha_entrega: str
    estado_firma: str
    documento_id: Optional[str] = None
    items_json: List[Dict[str, Any]]
    observaciones_normativas: str

    class Config:
        from_attributes = True
