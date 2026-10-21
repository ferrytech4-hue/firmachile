import React from 'react';
import { Building2, ShieldCheck, UserCheck, Menu, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Tenant, RoleType } from '../types';

interface HeaderProps {
  currentTenant: Tenant;
  tenants: Tenant[];
  onSelectTenant: (tenantId: string) => void;
  currentRole: RoleType;
  onSelectRole: (role: RoleType) => void;
  onToggleSidebar: () => void;
  onOpenSecurityTest: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTenant,
  tenants,
  onSelectTenant,
  currentRole,
  onSelectRole,
  onToggleSidebar,
  onOpenSecurityTest,
}) => {
  const roleLabels: Record<RoleType, string> = {
    superadmin: 'Superadmin Plataforma',
    admin_empresa: 'Administrador de Empresa',
    supervisor: 'Supervisor / Prevencionista',
    trabajador: 'Trabajador / Firmante',
    auditor: 'Auditor de Solo Lectura',
  };

  return (
    <header className="h-16 bg-[#0a1928] border-b border-[#1b344e] px-4 lg:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile Toggle & Brand indicator */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-slate-300 hover:text-white hover:bg-[#13273d] rounded-lg transition-colors"
          title="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs font-medium px-2.5 py-1 rounded-md bg-[#0f2d4a] text-cyan-300 border border-cyan-800/40">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>RLS Activo: Aislamiento Estricto</span>
        </div>
      </div>

      {/* Center/Right: Tenant Switcher & Role Switcher */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Prueba de aislamiento multiempresa */}
        <button
          onClick={onOpenSecurityTest}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-colors cursor-pointer"
          title="Verificar que una empresa no puede acceder a los datos de otra"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">Test Aislamiento RLS</span>
        </button>

        {/* Selector de Empresa (Tenant Switcher) */}
        <div className="flex items-center gap-1.5 bg-[#0f2438] border border-[#1d3d5e] rounded-lg px-2.5 py-1 text-xs">
          <Building2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <div className="flex flex-col text-left">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold hidden sm:inline">
              Empresa Activa
            </span>
            <select
              aria-label="Seleccionar empresa activa"
              value={currentTenant.id}
              onChange={(e) => onSelectTenant(e.target.value)}
              className="bg-transparent text-slate-100 font-semibold focus:outline-none cursor-pointer max-w-[150px] sm:max-w-[210px] truncate"
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id} className="bg-[#0a1928] text-white">
                  {t.nombreFantasia} ({t.rut})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selector de Rol */}
        <div className="hidden lg:flex items-center gap-1.5 bg-[#0f2438] border border-[#1d3d5e] rounded-lg px-2.5 py-1 text-xs">
          <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <div className="flex flex-col text-left">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              Rol Simulado
            </span>
            <select
              aria-label="Seleccionar rol simulado"
              value={currentRole}
              onChange={(e) => onSelectRole(e.target.value as RoleType)}
              className="bg-transparent text-slate-100 font-medium focus:outline-none cursor-pointer"
            >
              <option value="admin_empresa" className="bg-[#0a1928] text-white">Administrador Empresa</option>
              <option value="supervisor" className="bg-[#0a1928] text-white">Supervisor / Prevención</option>
              <option value="trabajador" className="bg-[#0a1928] text-white">Trabajador / Firmante</option>
              <option value="auditor" className="bg-[#0a1928] text-white">Auditor de solo lectura</option>
              <option value="superadmin" className="bg-[#0a1928] text-white">Superadmin SaaS</option>
            </select>
          </div>
        </div>

        {/* Avatar Usuario */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#1a334d]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-600 to-emerald-700 flex items-center justify-center font-bold text-xs text-white shadow-sm ring-1 ring-cyan-500/30">
            {currentRole === 'superadmin' ? 'SA' : 'CL'}
          </div>
        </div>
      </div>
    </header>
  );
};
