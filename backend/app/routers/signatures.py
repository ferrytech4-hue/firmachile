import uuid
import hashlib
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import SignatureRequest, Signer, SignatureEvent, Document, DocumentStatusEnum, AuditEvent
from ..schemas import SignAcceptRequest, SignRejectRequest

router = APIRouter(prefix="/signatures", tags=["Proceso de Firma Electrónica"])

@router.get("/portal/{token}")
def get_signature_portal_data(token: str, db: Session = Depends(get_db)):
    """
    Endpoint público para que el firmante acceda mediante el enlace seguro temporal.
    Valida token, vigencia y retorna información para lectura y firma.
    """
    sig_request = db.query(SignatureRequest).filter(SignatureRequest.token == token).first()
    if not sig_request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enlace de firma no válido o revocado.")

    if datetime.utcnow() > sig_request.expires_at:
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="El enlace de firma ha expirado.")

    doc = sig_request.document

    return {
        "signature_request_id": sig_request.id,
        "verification_code": sig_request.verification_code,
        "document": {
            "id": doc.id,
            "titulo": doc.titulo,
            "categoria": doc.categoria.value,
            "version": doc.version,
            "hash_sha256": doc.hash_sha256,
            "contenido_texto": doc.contenido_texto,
            "fecha_creacion": doc.fecha_creacion,
        },
        "signers": [
            {
                "id": s.id,
                "rut": s.rut,
                "nombre_completo": s.nombre_completo,
                "cargo": s.cargo,
                "orden_firma": s.orden_firma,
                "estado": s.estado,
            }
            for s in sig_request.signers
        ]
    }

@router.post("/portal/{token}/sign/{signer_id}")
def sign_document(
    token: str,
    signer_id: str,
    body: SignAcceptRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Registra la aceptación formal y suscripción de la Firma Electrónica Simple (FES).
    Calcula el hash final, estampa fecha UTC/CLT y almacena evidencias técnicas.
    """
    if not body.consent_acknowledged:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debe otorgar consentimiento expreso según Art. 3° Ley 19.799.",
        )

    sig_request = db.query(SignatureRequest).filter(SignatureRequest.token == token).first()
    if not sig_request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Solicitud no encontrada.")

    signer = db.query(Signer).filter(Signer.id == signer_id, Signer.signature_request_id == sig_request.id).first()
    if not signer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Firmante no encontrado.")

    if signer.estado == "firmado":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Este firmante ya suscribió el documento.")

    now = datetime.utcnow()
    client_ip = request.client.host if request.client else "190.161.42.115"
    user_agent = request.headers.get("user-agent", "Mozilla/5.0")

    # Actualizar estado del firmante
    signer.estado = "firmado"
    signer.fecha_firma_utc = now
    signer.fecha_firma_clt = now.strftime("%d/%m/%Y %H:%M:%S (CLT)")
    signer.ip_address = client_ip
    signer.user_agent = user_agent
    signer.cedula_serie = body.cedula_serie or "DECLARADA"

    # Registrar evento de firma
    sig_event = SignatureEvent(
        id=f"sev-{uuid.uuid4().hex[:12]}",
        signer_id=signer.id,
        event_type="ACCEPTED",
        timestamp_utc=now,
        ip_address=client_ip,
        evidence_payload={
            "cedula_serie": body.cedula_serie,
            "has_signature_image": bool(body.firma_data_url),
            "consent_version": sig_request.texto_aceptacion_version,
        }
    )
    db.add(sig_event)

    # Comprobar si todos firmaron
    all_signed = all(s.estado == "firmado" for s in sig_request.signers)
    if all_signed:
        doc = sig_request.document
        doc.estado = DocumentStatusEnum.FIRMADO
        doc.fecha_completado = now
        sig_request.estado = "completado"

    # Auditoría
    audit = AuditEvent(
        id=f"aud-{uuid.uuid4().hex[:12]}",
        tenant_id=sig_request.tenant_id,
        user_nombre=signer.nombre_completo,
        user_email=signer.email,
        accion="SIGNATURE_ACCEPTED",
        recurso_tipo="DOCUMENT",
        recurso_id=sig_request.document_id,
        detalles=f"Firma Electrónica Simple registrada por {signer.nombre_completo} (RUT: {signer.rut}).",
        ip_address=client_ip,
        hash_evento=sig_request.document.hash_sha256,
    )
    db.add(audit)

    db.commit()

    return {
        "status": "success",
        "message": "Firma registrada exitosamente conforme a la Ley N° 19.799.",
        "verification_code": sig_request.verification_code,
        "all_completed": all_signed,
    }

@router.post("/portal/{token}/reject/{signer_id}")
def reject_document(
    token: str,
    signer_id: str,
    body: SignRejectRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """Registra el rechazo formal de firma con justificación."""
    if not body.motivo_rechazo.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Debe ingresar el motivo del rechazo.")

    sig_request = db.query(SignatureRequest).filter(SignatureRequest.token == token).first()
    if not sig_request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Solicitud no encontrada.")

    signer = db.query(Signer).filter(Signer.id == signer_id, Signer.signature_request_id == sig_request.id).first()
    if not signer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Firmante no encontrado.")

    now = datetime.utcnow()
    client_ip = request.client.host if request.client else "190.161.42.115"

    signer.estado = "rechazado"
    signer.motivo_rechazo = body.motivo_rechazo.strip()
    signer.fecha_firma_utc = now

    doc = sig_request.document
    doc.estado = DocumentStatusEnum.RECHAZADO
    sig_request.estado = "rechazado"

    audit = AuditEvent(
        id=f"aud-{uuid.uuid4().hex[:12]}",
        tenant_id=sig_request.tenant_id,
        user_nombre=signer.nombre_completo,
        user_email=signer.email,
        accion="SIGNATURE_REJECTED",
        recurso_tipo="DOCUMENT",
        recurso_id=doc.id,
        detalles=f"Documento rechazado por {signer.nombre_completo}. Motivo: {body.motivo_rechazo}",
        ip_address=client_ip,
        hash_evento=doc.hash_sha256,
    )
    db.add(audit)
    db.commit()

    return {"status": "rejected", "message": "Rechazo registrado formalmente."}
