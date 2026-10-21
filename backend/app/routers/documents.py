import uuid
import hashlib
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Document, DocumentVersion, SignatureRequest, Signer, AuditEvent, RoleEnum, DocumentStatusEnum
from ..schemas import DocumentCreate, DocumentOut
from ..security import get_current_tenant_context, CurrentTenantContext, require_roles

router = APIRouter(prefix="/documents", tags=["Gestión Documental"])

@router.post("", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
def create_document(
    doc_in: DocumentCreate,
    ctx: CurrentTenantContext = Depends(require_roles([RoleEnum.ADMIN_EMPRESA, RoleEnum.SUPERVISOR])),
    db: Session = Depends(get_db)
):
    """
    Crea un nuevo documento laboral, calcula su hash SHA-256 inmutable y prepara la solicitud de firma.
    Aplica límites de cuota mensual según el plan de suscripción del tenant.
    """
    tenant = ctx.tenant

    # Validar cuota mensual del plan
    if tenant.documentos_consumidos_mes >= tenant.limite_documentos_mes:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Límite mensual alcanzado ({tenant.limite_documentos_mes} documentos). Mejore su plan de suscripción.",
        )

    # Calcular hash SHA-256 del contenido
    content_bytes = (doc_in.contenido_texto or doc_in.titulo).encode("utf-8")
    hash_sha256 = hashlib.sha256(content_bytes).hexdigest()

    doc_id = f"doc-{uuid.uuid4().hex[:12]}"
    now = datetime.utcnow()
    expires_at = now + timedelta(days=doc_in.dias_vencimiento)

    new_doc = Document(
        id=doc_id,
        tenant_id=ctx.tenant_id,
        titulo=doc_in.titulo,
        categoria=doc_in.categoria,
        tipo_firma_requerida=doc_in.tipo_firma,
        estado=DocumentStatusEnum.PENDIENTE,
        version=1,
        hash_sha256=hash_sha256,
        contenido_texto=doc_in.contenido_texto,
        nombre_archivo=doc_in.nombre_archivo or f"{doc_id}.pdf",
        tamano_bytes=len(content_bytes),
        creado_por_user_id=ctx.user.id,
        creado_por_nombre=ctx.user.nombre_completo,
        trabajador_destinatario_id=doc_in.trabajador_destinatario_id,
        fecha_creacion=now,
        fecha_vencimiento=expires_at,
    )
    db.add(new_doc)

    # Crear versión inicial
    initial_version = DocumentVersion(
        id=f"ver-{uuid.uuid4().hex[:12]}",
        document_id=doc_id,
        version_number=1,
        hash_sha256=hash_sha256,
        storage_path=f"documents/{ctx.tenant_id}/{doc_id}_v1.pdf",
    )
    db.add(initial_version)

    # Crear solicitud de firma
    sig_request = SignatureRequest(
        id=f"sr-{uuid.uuid4().hex[:12]}",
        document_id=doc_id,
        tenant_id=ctx.tenant_id,
        verification_code=f"FD-CL-{uuid.uuid4().hex[:4].upper()}-{uuid.uuid4().hex[:4].upper()}",
        token=uuid.uuid4().hex,
        estado="pendiente",
        expires_at=expires_at,
    )
    db.add(sig_request)

    # Crear firmantes
    created_signers = []
    for s in doc_in.firmantes:
        signer = Signer(
            id=f"sig-{uuid.uuid4().hex[:12]}",
            signature_request_id=sig_request.id,
            rut=s.rut,
            nombre_completo=s.nombre_completo,
            email=s.email,
            cargo=s.cargo,
            orden_firma=s.orden_firma,
            estado="pendiente",
            tipo_firma=doc_in.tipo_firma,
        )
        db.add(signer)
        created_signers.append(signer)

    # Actualizar consumo de cuota
    tenant.documentos_consumidos_mes += 1

    # Registrar evento en auditoría
    audit = AuditEvent(
        id=f"aud-{uuid.uuid4().hex[:12]}",
        tenant_id=ctx.tenant_id,
        user_id=ctx.user.id,
        user_nombre=ctx.user.nombre_completo,
        user_email=ctx.user.email,
        accion="DOCUMENT_CREATED",
        recurso_tipo="DOCUMENT",
        recurso_id=doc_id,
        detalles=f"Documento '{doc_in.titulo}' creado y enviado a firma.",
        ip_address="190.161.42.115",
        hash_evento=hash_sha256,
    )
    db.add(audit)

    db.commit()
    db.refresh(new_doc)

    return new_doc

@router.get("", response_model=List[DocumentOut])
def list_documents(
    categoria: Optional[str] = None,
    estado: Optional[str] = None,
    ctx: CurrentTenantContext = Depends(get_current_tenant_context),
    db: Session = Depends(get_db)
):
    """
    Lista los documentos pertenecientes EXCLUSIVAMENTE a la empresa activa.
    Aislamiento garantizado por filtro estricto tenant_id.
    """
    query = db.query(Document).filter(Document.tenant_id == ctx.tenant_id)
    if categoria:
        query = query.filter(Document.categoria == categoria)
    if estado:
        query = query.filter(Document.estado == estado)

    return query.order_by(Document.fecha_creacion.desc()).all()

@router.get("/{document_id}", response_model=DocumentOut)
def get_document(
    document_id: str,
    ctx: CurrentTenantContext = Depends(get_current_tenant_context),
    db: Session = Depends(get_db)
):
    """
    Obtiene el detalle de un documento.
    Verifica de forma estricta que pertenezca a la empresa del solicitante.
    Si se intenta acceder a un documento de otra empresa, retorna HTTP 403 Forbidden.
    """
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Documento no encontrado.")

    # Control de aislamiento estricto
    if doc.tenant_id != ctx.tenant_id:
        # Registrar intento de intrusión en auditoría
        audit = AuditEvent(
            id=f"aud-{uuid.uuid4().hex[:12]}",
            tenant_id=ctx.tenant_id,
            user_id=ctx.user.id,
            user_nombre=ctx.user.nombre_completo,
            user_email=ctx.user.email,
            accion="CROSS_TENANT_ACCESS_BLOCKED",
            recurso_tipo="DOCUMENT",
            recurso_id=document_id,
            detalles=f"ALERTA: Intento de acceso no autorizado a documento de otro tenant ({doc.tenant_id}).",
            ip_address="190.161.42.115",
            hash_evento=uuid.uuid4().hex,
        )
        db.add(audit)
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ACCESO DENEGADO: El documento solicitado no pertenece a su organización.",
        )

    return doc
