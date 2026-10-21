from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Tenant, RoleEnum
from ..security import get_current_tenant_context, CurrentTenantContext, require_roles

router = APIRouter(prefix="/subscriptions", tags=["Suscripciones y Pagos"])

PLANS_INFO = [
    {
        "id": "inicial",
        "nombre": "Plan Inicial",
        "precio_mensual_clp": 24990,
        "limite_documentos_mes": 30,
        "limite_usuarios": 2,
        "limite_almacenamiento_mb": 500,
        "descripcion": "Para contratistas y pymes en formalización laboral."
    },
    {
        "id": "empresa",
        "nombre": "Plan Empresa",
        "precio_mensual_clp": 69990,
        "limite_documentos_mes": 250,
        "limite_usuarios": 8,
        "limite_almacenamiento_mb": 2500,
        "descripcion": "Para constructoras e industrias con múltiples obras."
    },
    {
        "id": "profesional",
        "nombre": "Plan Profesional",
        "precio_mensual_clp": 149900,
        "limite_documentos_mes": 1500,
        "limite_usuarios": 25,
        "limite_almacenamiento_mb": 10000,
        "descripcion": "Para grandes empresas y minería con centros de costo."
    }
]

@router.get("/plans")
def list_plans():
    """Retorna los planes comerciales vigentes en pesos chilenos."""
    return PLANS_INFO

@router.get("/usage")
def get_current_usage(ctx: CurrentTenantContext = Depends(get_current_tenant_context)):
    """Retorna el consumo actual de cuotas para la empresa activa."""
    tenant = ctx.tenant
    return {
        "tenant_id": tenant.id,
        "plan_id": tenant.plan_id,
        "documentos_consumidos_mes": tenant.documentos_consumidos_mes,
        "limite_documentos_mes": tenant.limite_documentos_mes,
        "almacenamiento_usado_mb": tenant.almacenamiento_usado_mb,
        "limite_almacenamiento_mb": tenant.limite_almacenamiento_mb,
        "limite_usuarios": tenant.limite_usuarios,
        "porcentaje_documentos": round((tenant.documentos_consumidos_mes / tenant.limite_documentos_mes) * 100, 1),
    }

@router.post("/change-plan/{plan_id}")
def change_plan(
    plan_id: str,
    ctx: CurrentTenantContext = Depends(require_roles([RoleEnum.ADMIN_EMPRESA])),
    db: Session = Depends(get_db)
):
    """Actualiza el plan de suscripción de la empresa."""
    plan = next((p for p in PLANS_INFO if p["id"] == plan_id), None)
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan no encontrado.")

    tenant = ctx.tenant
    tenant.plan_id = plan["id"]
    tenant.limite_documentos_mes = plan["limite_documentos_mes"]
    tenant.limite_almacenamiento_mb = plan["limite_almacenamiento_mb"]
    tenant.limite_usuarios = plan["limite_usuarios"]
    db.commit()

    return {"status": "success", "message": f"Plan actualizado exitosamente a {plan['nombre']}"}
