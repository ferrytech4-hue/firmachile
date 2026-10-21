import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Worker, RoleEnum
from ..schemas import WorkerCreate, WorkerOut
from ..security import get_current_tenant_context, CurrentTenantContext, require_roles

router = APIRouter(prefix="/workers", tags=["Gestión de Trabajadores"])

@router.post("", response_model=WorkerOut, status_code=status.HTTP_201_CREATED)
def create_worker(
    worker_in: WorkerCreate,
    ctx: CurrentTenantContext = Depends(require_roles([RoleEnum.ADMIN_EMPRESA, RoleEnum.SUPERVISOR])),
    db: Session = Depends(get_db)
):
    """Registra un nuevo trabajador en la empresa activa con RUT validado."""
    worker_id = f"w-{uuid.uuid4().hex[:12]}"
    new_worker = Worker(
        id=worker_id,
        tenant_id=ctx.tenant_id,
        rut=worker_in.rut,
        nombres=worker_in.nombres,
        apellidos=worker_in.apellidos,
        email=worker_in.email,
        telefono=worker_in.telefono,
        cargo=worker_in.cargo,
        faena_ubicacion=worker_in.faena_ubicacion,
        fecha_ingreso=worker_in.fecha_ingreso,
        afp=worker_in.afp,
        salud=worker_in.salud,
        estado="activo",
    )
    db.add(new_worker)
    db.commit()
    db.refresh(new_worker)
    return new_worker

@router.get("", response_model=List[WorkerOut])
def list_workers(
    ctx: CurrentTenantContext = Depends(get_current_tenant_context),
    db: Session = Depends(get_db)
):
    """Lista los trabajadores pertenecientes estrictamente a la empresa activa."""
    return db.query(Worker).filter(Worker.tenant_id == ctx.tenant_id).all()
