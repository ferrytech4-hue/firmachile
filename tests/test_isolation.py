import pytest
from fastapi import status

def test_tenant_isolation_prevents_cross_tenant_document_read(client, seed_two_tenants):
    """
    PRUEBA DE SEGURIDAD CRÍTICA (Sección 3 y 12 del requerimiento):
    Verifica que el usuario de Constructora Andina SpA NO PUEDE acceder
    al documento confidencial de Servicios Mineros del Norte S.A.
    manipulando el ID en la solicitud.
    """
    token_andina = seed_two_tenants["token_andina"]
    doc_minera_id = seed_two_tenants["doc_minera_id"]

    # El usuario de Andina intenta consultar el documento de Minera
    headers = {"Authorization": f"Bearer {token_andina}"}
    response = client.get(f"/api/v1/documents/{doc_minera_id}", headers=headers)

    # Debe ser denegado terminantemente con HTTP 403 Forbidden
    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert "ACCESO DENEGADO" in response.json()["detail"]

def test_tenant_can_read_own_document(client, seed_two_tenants):
    """Verifica que el usuario legítimo de Minera sí puede acceder a su propio documento."""
    token_minera = seed_two_tenants["token_minera"]
    doc_minera_id = seed_two_tenants["doc_minera_id"]

    headers = {"Authorization": f"Bearer {token_minera}"}
    response = client.get(f"/api/v1/documents/{doc_minera_id}", headers=headers)

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == doc_minera_id
    assert data["tenant_id"] == "tenant-minera"

def test_list_documents_only_returns_current_tenant_records(client, seed_two_tenants):
    """Verifica que el listado de documentos no filtre registros de otras empresas."""
    token_andina = seed_two_tenants["token_andina"]
    headers = {"Authorization": f"Bearer {token_andina}"}

    response = client.get("/api/v1/documents", headers=headers)
    assert response.status_code == status.HTTP_200_OK
    docs = response.json()

    # No debe contener ningún documento de Minera
    for d in docs:
        assert d["tenant_id"] == "tenant-andina"
