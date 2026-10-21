import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Wrench, 
  HardHat, 
  Users, 
  QrCode, 
  ShieldAlert, 
  CreditCard, 
  Settings, 
  FileSignature,
  X,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { Tenant } from '../types';

export type NavTab = 
  | 'dashboard'
  | 'documents'
  | 'cargo'
  | 'epp'
  | 'workers'
  | 'verification'
  | 'audit'
  | 'subscription'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  tenant: Tenant;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  tenant,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Panel de Resumen', icon: LayoutDashboard },
    { id: 'documents', label: 'Gestión Documental', icon: FileText, badge: 'Ley 19.799' },
    { id: 'cargo', label: 'Hojas de Cargo', icon: Wrench },
    { id: 'epp', label: 'Entrega de EPP', icon: HardHat, badge: 'D.S. 594' },
    { id: 'workers', label: 'Trabajadores', icon: Users },
    { id: 'verification', label: 'Verificar Documento', icon: QrCode },
    { id: 'audit', label: 'Registro de Auditoría', icon: ShieldAlert },
    { id: 'subscription', label: 'Planes y Consumo', icon: CreditCard },
    { id: 'settings', label: 'Empresa y Seguridad', icon: Settings },
  ];

  const handleSelect = (id: NavTab) => {
    onSelectTab(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-[#0a1826] border-r border-[#19324b] z-50 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 px-5 border-b border-[#19324b] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#0c4a6e] to-[#047857] flex items-center justify-center text-white shadow-md ring-1 ring-emerald-500/30">
              <FileSignature className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-white block">
                FirmaDigital <span className="text-emerald-400">Chile</span>
              </span>
              <span className="text-[10px] text-slate-400 tracking-wide font-medium block">
                SaaS Multiempresa Laboral
              </span>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tenant Mini Card */}
        <div className="p-3 mx-3 my-3 rounded-lg bg-[#0d2235] border border-[#1b3b5c]/60">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
              Empresa
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {tenant.planId.toUpperCase()}
            </span>
          </div>
          <p className="text-xs font-bold text-slate-200 truncate mt-1">
            {tenant.razonSocial}
          </p>
          <p className="text-[11px] font-mono text-cyan-300/80">
            {tenant.rut}
          </p>
          <div className="mt-2 text-[10px] text-slate-400 flex justify-between">
            <span>Docs mes:</span>
            <span className="font-semibold text-slate-200">
              {tenant.documentosConsumidosMes} / {tenant.limiteDocumentosMes}
            </span>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id as NavTab)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-[#0d3b66] to-[#0a4b3d] text-white shadow-sm border border-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-[#12283d]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-300' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${
                    isActive ? 'bg-emerald-400/20 text-emerald-200' : 'bg-[#183552] text-cyan-300'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Legal footer */}
        <div className="p-3 border-t border-[#19324b] text-[10px] text-slate-400 bg-[#081420]">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Ley 19.799 & Dictámenes DT</span>
          </div>
          <p className="leading-tight text-slate-400">
            Firma Electrónica Simple con sellado de tiempo UTC/CLT y hash SHA-256.
          </p>
        </div>
      </aside>
    </>
  );
};
