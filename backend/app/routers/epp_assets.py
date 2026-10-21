import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Asset, EppDelivery, RoleEnum
from ..schemas import AssetCreate, AssetOut, EppDeliveryCreate, EppDeliveryOut
from ..security import get_current_tenant_context, CurrentTenantContext, require_roles

router = APIRouter(prefix="/cargo-epp", tags=["Hojas de Cargo y EPP"])

@router.post("/assets", response_model=AssetOut, status_code=status.HTTP_201_CREATED)
def create_asset(
    asset_in: AssetCreate,
    ctx: CurrentTenantContext = Depends(require_roles([RoleEnum.ADMIN_EMPRESA, RoleEnum.SUPERVISOR])),
    db: Session = Depends(get_db)
):
    """Registra una herramienta o activo en el pañol de la empresa."""
    asset_id = f"ast-{uuid.uuid4().hex[:12]}"
    new_asset = Asset(
        id=asset_id,
        tenant_id=ctx.tenant_id,
        codigo_inventario=asset_in.codigo_inventario.upper(),
        nombre=asset_in.nombre,
        marca=asset_in.marca,
        modelo=asset_in.modelo,
        numero_serie=asset_in.numero_serie,
        valor_estimado_clp=asset_in.valor_estimado_clp,
        observaciones=asset_in.observaciones,
        estado="operativo",
    )
    db.add(new_asset)
    db.commit()
    db.refresh(new_asset)
    return new_asset

@router.get("/assets", response_model=List[AssetOut])
def list_assets(
    ctx: CurrentTenantContext = Depends(get_current_tenant_context),
    db: Session = Depends(get_db)
):
    """Lista las herramientas del inventario de la empresa activa."""
    return db.query(Asset).filter(Asset.tenant_id == ctx.tenant_id).all()

@router.post("/epp", response_model=EppDeliveryOut, status_code=status.HTTP_201_CREATED)
def create_epp_delivery(
    epp_in: EppDeliveryCreate,
    ctx: CurrentTenantContext = Depends(require_roles([RoleEnum.ADMIN_EMPRESA, RoleEnum.SUPERVISOR])),
    db: Session = Depends(get_db)
):
    """Registra un acta de entrega de EPP en cumplimiento con el D.S. 594 Art. 68 y Ley 16.744."""
    del_id = f"epp-{uuid.uuid4().hex[:12]}"
    new_epp = EppDelivery(
        id=del_id,
        tenant_id=ctx.tenant_id,
        worker_id=epp_in.worker_id,
        supervisor_responsable=epp_in.supervisor_responsable,
        faena_ubicacion=epp_in.faena_ubicacion,
        fecha_entrega=epp_in.fecha_entrega,
        items_json=[item.model_dump() for item in epp_in.items],
        observaciones_normativas="Entrega conforme a matriz de riesgos del puesto y D.S. 594 Art. 68.",
        estado_firma="pendiente",
    )
    db.add(new_epp)
    db.commit()
    db.refresh(new_epp)
    return new_epp

@router.get("/epp", response_model=List[EppDeliveryOut])
def list_epp_deliveries(
    ctx: CurrentTenantContext = Depends(get_current_tenant_context),
    db: Session = Depends(get_db)
):
    """Lista los registros de entrega de EPP de la empresa activa."""
    return db.query(EppDelivery).filter(EppDelivery.tenant_id == ctx.tenant_id).all()
