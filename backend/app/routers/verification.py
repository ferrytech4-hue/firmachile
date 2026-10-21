from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Document, SignatureRequest, DocumentStatusEnum

router = APIRouter(prefix="/verify", tags=["Verificación Pública"])

@router.get("/{verification_code}")
def verify_document(verification_code: str, db: Session = Depends(get_db)):
    """
    Verifica públicamente la validez legal, integridad SHA-256 y sellado de tiempo de un documento.
    Accesible sin autenticación para inspectores de la Dirección del Trabajo y terceros.
    """
    clean_code = verification_code.strip().upper()

    # Buscar por código de verificación o por document ID
    sig_request = db.query(SignatureRequest).filter(SignatureRequest.verification_code == clean_code).first()
    if sig_request:
        doc = sig_request.document
    else:
        doc = db.query(Document).filter(Document.id == clean_code).first()

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró ningún documento con el código de verificación ingresado.",
        )

    return {
        "status": "valid",
        "document_id": doc.id,
        "titulo": doc.titulo,
        "categoria": doc.categoria.value,
        "version": doc.version,
        "hash_sha256": doc.hash_sha256,
        "estado": doc.estado.value,
        "fecha_creacion": doc.fecha_creacion,
        "fecha_completado": doc.fecha_completado,
        "firmantes": [
            {
                "nombre_completo": s.nombre_completo,
                "rut": s.rut,
                "cargo": s.cargo,
                "estado": s.estado,
                "fecha_firma_utc": s.fecha_firma_utc,
                "fecha_firma_clt": s.fecha_firma_clt,
                "ip_address": s.ip_address,
            }
            for req in doc.signature_requests
            for s in req.signers
        ],
        "legal_notice": (
            "Documento suscrito bajo la Ley N° 19.799 sobre Documentos Electrónicos y Firma Electrónica "
            "de la República de Chile."
        )
    }
