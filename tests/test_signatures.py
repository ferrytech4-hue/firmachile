import pytest
from fastapi import status
from backend.app.models import Document, AuditEvent

def test_document_creation_and_signature_flow(client, seed_two_tenants, db):
    """Prueba completa del ciclo de vida de un documento y su firma electrónica simple."""
    token_andina = seed_two_tenants["token_andina"]
    headers = {"Authorization": f"Bearer {token_andina}"}

    # 1. Crear documento
    payload = {
        "titulo": "Contrato de Trabajo - Operario de Faena",
        "categoria": "contrato",
        "tipo_firma": "simple",
        "contenido_texto": "Contrato de trabajo con jornada de 40 horas semanales según Ley 21.561.",
        "firmantes": [
            {
                "rut": "16.482.903-7",
                "nombre_completo": "Rodrigo Alejandro Muñoz Valenzuela",
                "email": "rmunoz@andina.cl",
                "cargo": "Operario",
                "orden_firma": 1
            }
        ],
        "dias_vencimiento": 15
    }
    response = client.post("/api/v1/documents", json=payload, headers=headers)
    assert response.status_code == status.HTTP_201_CREATED
    doc_data = response.json()
    doc_id = doc_data["id"]
    assert doc_data["estado"] == "pendiente"
    assert len(doc_data["hash_sha256"]) == 64  # SHA-256 es de 64 caracteres hex

    # 2. Consultar portal de firma usando el token
    # Buscar el token generado en la base de datos
    from backend.app.models import SignatureRequest
    sig_req = db.query(SignatureRequest).filter(SignatureRequest.document_id == doc_id).first()
    assert sig_req is not None
    token = sig_req.token
    signer_id = sig_req.signers[0].id

    portal_res = client.get(f"/api/v1/signatures/portal/{token}")
    assert portal_res.status_code == status.HTTP_200_OK
    assert portal_res.json()["verification_code"].startswith("FD-CL-")

    # 3. Firmar documento
    sign_payload = {
        "consent_acknowledged": True,
        "cedula_serie": "A192038102",
        "firma_data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    }
    sign_res = client.post(f"/api/v1/signatures/portal/{token}/sign/{signer_id}", json=sign_payload)
    assert sign_res.status_code == status.HTTP_200_OK
    assert sign_res.json()["status"] == "success"

    # 4. Verificar que el documento pasó a estado FIRMADO
    updated_doc = db.query(Document).filter(Document.id == doc_id).first()
    assert updated_doc.estado.value == "firmado"

    # 5. Verificar que se registró en auditoría
    audit_events = db.query(AuditEvent).filter(AuditEvent.recurso_id == doc_id).all()
    actions = [a.accion for a in audit_events]
    assert "DOCUMENT_CREATED" in actions
    assert "SIGNATURE_ACCEPTED" in actions

    # 6. Verificación pública sin token
    verify_res = client.get(f"/api/v1/verify/{sig_req.verification_code}")
    assert verify_res.status_code == status.HTTP_200_OK
    assert verify_res.json()["status"] == "valid"
    assert verify_res.json()["hash_sha256"] == doc_data["hash_sha256"]
