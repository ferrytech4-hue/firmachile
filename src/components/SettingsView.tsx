import React, { useState } from 'react';
import { 
  Building2, 
  Save, 
  ShieldCheck, 
  Key, 
  RotateCcw, 
  Database, 
  FileText, 
  Check, 
  AlertTriangle 
} from 'lucide-react';
import { Tenant } from '../types';
import { storage } from '../services/mockStorage';

interface SettingsViewProps {
  tenant: Tenant;
  onTenantUpdated: (updated: Tenant) => void;
  onResetFactoryData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  tenant,
  onTenantUpdated,
  onResetFactoryData,
}) => {
  const [razonSocial, setRazonSocial] = useState(tenant.razonSocial);
  const [nombreFantasia, setNombreFantasia] = useState(tenant.nombreFantasia);
  const [giro, setGiro] = useState(tenant.giro);
  const [direccion, setDireccion] = useState(tenant.direccion);
  const [comuna, setComuna] = useState(tenant.comuna);
  const [region, setRegion] = useState(tenant.region);
  const [telefono, setTelefono] = useState(tenant.telefono);
  const [emailContacto, setEmailContacto] = useState(tenant.emailContacto);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Tenant = {
      ...tenant,
      razonSocial: razonSocial.trim(),
      nombreFantasia: nombreFantasia.trim(),
      giro: giro.trim(),
      direccion: direccion.trim(),
      comuna: comuna.trim(),
      region: region.trim(),
      telefono: telefono.trim(),
      emailContacto: emailContacto.trim(),
    };
    storage.updateTenant(updated);
    onTenantUpdated(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight">
          Configuración Empresarial y Parámetros de Seguridad
        </h2>
        <p className="text-xs text-slate-400">
          Identificación legal ante el SII y la Dirección del Trabajo, configuración de notificaciones y políticas RLS.
        </p>
      </div>

      <form onSubmit={handleSave} className="p-6 rounded-2xl bg-[#0c1e30] border border-[#1b3b5c] shadow-sm space-y-4 text-xs">
        <h3 className="font-bold text-sm text-white flex items-center gap-2 pb-2 border-b border-[#183654]">
          <Building2 className="w-4 h-4 text-emerald-400" />
          <span>Ficha de la Empresa (Tenant ID: {tenant.id})</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-300 mb-1 font-bold">RUT Empresa (Inmutable):</label>
            <input
              type="text"
              disabled
              value={tenant.rut}
              className="w-full bg-[#07131f] border border-[#15324d] rounded-lg p-2 text-cyan-300 font-mono text-xs cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-1 font-bold">Nombre de Fantasía:</label>
            <input
              type="text"
              value={nombreFantasia}
              onChange={(e) => setNombreFantasia(e.target.value)}
              className="w-full bg-[#081522] border border-[#193552] rounded-lg p-2 text-white focus:border-cyan-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-300 mb-1 font-bold">Razón Social Completa:</label>
          <input
            type="text"
            value={razonSocial}
            onChange={(e) => setRazonSocial(e.target.value)}
            className="w-full bg-[#081522] border border-[#193552] rounded-lg p-2 text-white focus:border-cyan-400"
          />
        </div>

        <div>
          <label className="block text-slate-300 mb-1">Giro Comercial Oficial:</label>
          <input
            type="text"
            value={giro}
            onChange={(e) => setGiro(e.target.value)}
            className="w-full bg-[#081522] border border-[#193552] rounded-lg p-2 text-white focus:border-cyan-400"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-slate-300 mb-1">Dirección:</label>
            <input
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              className="w-full bg-[#081522] border border-[#193552] rounded-lg p-2 text-white"
            />
          </div>
          <div>
            <label className="block text-slate-300 mb-1">Comuna:</label>
            <input
              type="text"
              value={comuna}
              onChange={(e) => setComuna(e.target.value)}
              className="w-full bg-[#081522] border border-[#193552] rounded-lg p-2 text-white"
            />
          </div>
          <div>
            <label className="block text-slate-300 mb-1">Región:</label>
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full bg-[#081522] border border-[#193552] rounded-lg p-2 text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-300 mb-1">Teléfono Central:</label>
            <input
              type="text"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="w-full bg-[#081522] border border-[#193552] rounded-lg p-2 text-white"
            />
          </div>
          <div>
            <label className="block text-slate-300 mb-1">Correo de Contacto y Notificaciones:</label>
            <input
              type="email"
              value={emailContacto}
              onChange={(e) => setEmailContacto(e.target.value)}
              className="w-full bg-[#081522] border border-[#193552] rounded-lg p-2 text-white"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-[#183654]">
          {savedSuccess ? (
            <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              <span>Cambios guardados con éxito</span>
            </span>
          ) : <div />}

          <button
            type="submit"
            className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow cursor-pointer transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Información</span>
          </button>
        </div>
      </form>

      {/* Acciones de Sistema y Base de Datos */}
      <div className="p-6 rounded-2xl bg-[#0c1e30] border border-[#1b3b5c] shadow-sm space-y-3 text-xs">
        <h3 className="font-bold text-sm text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" />
          <span>Mantenimiento de Datos y Reset de Fábrica</span>
        </h3>
        <p className="text-slate-400 text-[11px]">
          Si desea restablecer las empresas de demostración (Constructora Andina, Servicios Mineros, Logística Austral), trabajadores y documentos a su estado inicial:
        </p>

        <button
          type="button"
          onClick={() => {
            if (confirm('¿Desea restaurar todos los datos de muestra de fábrica?')) {
              onResetFactoryData();
            }
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-950/40 text-red-300 border border-red-800/40 hover:bg-red-900/40 text-xs font-semibold cursor-pointer transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restablecer Datos de Demostración</span>
        </button>
      </div>
    </div>
  );
};
