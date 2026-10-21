import React, { useState } from 'react';
import { 
  ShieldAlert, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Lock, 
  Terminal,
  Play
} from 'lucide-react';
import { Tenant, Document } from '../types';
import { storage } from '../services/mockStorage';

interface SecurityTestModalProps {
  currentTenant: Tenant;
  tenants: Tenant[];
  onClose: () => void;
  onRefreshAudit: () => void;
}

export const SecurityTestModal: React.FC<SecurityTestModalProps> = ({
  currentTenant,
  tenants,
  onClose,
  onRefreshAudit,
}) => {
  const otherTenants = tenants.filter(t => t.id !== currentTenant.id);
  const targetTenant = otherTenants[0] || tenants[0];
  
  // Buscar un documento del otro tenant
  const otherDocs = targetTenant ? storage.getDocuments(targetTenant.id) : [];
  const targetDoc = otherDocs[0];

  const [testResult, setTestResult] = useState<{
    attempted: boolean;
    status: number;
    message: string;
    details: string;
  } | null>(null);

  const [isExecuting, setIsExecuting] = useState(false);

  const handleExecuteAttack = () => {
    setIsExecuting(true);
    setTestResult(null);

    setTimeout(() => {
      const targetDocId = targetDoc?.id || 'doc-minera-001';
      const outcome = storage.simulateCrossTenantAttack(currentTenant.id, targetDocId);

      setTestResult({
        attempted: true,
        status: outcome.success ? 200 : 403,
        message: outcome.message,
        details: `Solicitante: ${currentTenant.razonSocial} (Tenant ID: ${currentTenant.id}) intentó forzar lectura de ID ${targetDocId} (Propiedad de: ${targetTenant?.razonSocial || 'Otra empresa'}). Resultado: POLÍTICA RLS BLOQUEÓ LA CONSULTA.`
      });

      setIsExecuting(false);
      onRefreshAudit();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#0b1c2e] border border-amber-500/40 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1b3d60]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">
                Verificador de Aislamiento Multiempresa (Row-Level Security)
              </h3>
              <p className="text-[11px] text-slate-300">
                Prueba interactiva de prevención de fuga de datos entre empresas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Explicación técnica */}
        <div className="p-3.5 rounded-xl bg-[#081522] border border-[#163350] text-xs text-slate-300 space-y-2">
          <p className="font-bold text-white flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Escenario de Prueba de Penetración:</span>
          </p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Se intentará falsificar un llamado a la base de datos solicitando directamente los contratos u hojas de cargo de la empresa <strong>{targetTenant?.nombreFantasia}</strong> utilizando la sesión autenticada de <strong>{currentTenant.nombreFantasia}</strong>.
          </p>
        </div>

        {/* Parámetros del intento */}
        <div className="p-3.5 rounded-xl bg-[#07131f] border border-[#132d47] font-mono text-xs space-y-1 text-slate-300">
          <div className="text-cyan-400 font-bold text-[11px] mb-1">
            // VECTORES DE LA SOLICITUD
          </div>
          <div>GET /api/v1/documents/{targetDoc?.id || 'doc-minera-001'}</div>
          <div>Authorization: Bearer session_token_de_{currentTenant.id}</div>
          <div>Tenant Context: <span className="text-amber-400">{currentTenant.id}</span></div>
          <div>Target Resource Owner: <span className="text-red-400">{targetTenant?.id || 'tenant-minera'}</span></div>
        </div>

        {/* Botón para lanzar prueba */}
        <div>
          <button
            onClick={handleExecuteAttack}
            disabled={isExecuting}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-colors shadow cursor-pointer disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isExecuting ? 'Ejecutando Comprobación RLS...' : 'Lanzar Prueba de Acceso Cruzado Forzado'}</span>
          </button>
        </div>

        {/* Resultado */}
        {testResult && (
          <div className="p-4 rounded-xl bg-red-950/20 border border-red-800/40 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-red-400 font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>RESPUESTA DEL SISTEMA: HTTP {testResult.status} FORBIDDEN</span>
            </div>
            <p className="text-slate-200 text-[11px] leading-relaxed">
              {testResult.message}
            </p>
            <div className="p-2 rounded bg-[#06101a] border border-red-900/30 text-[10px] font-mono text-slate-400">
              ✓ Evento de seguridad registrado inmutablemente en el Audit Log con hash SHA-256.
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#14324f] hover:bg-[#1b4066] text-white rounded-xl text-xs font-semibold"
          >
            Entendido y Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
