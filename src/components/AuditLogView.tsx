import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Lock,
  Calendar,
  Layers
} from 'lucide-react';
import { Tenant, AuditEvent } from '../types';

interface AuditLogViewProps {
  tenant: Tenant;
  logs: AuditEvent[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({
  tenant,
  logs,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.accion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.detalles.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.recursoId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = actionFilter === 'all' || log.accion === actionFilter;

    return matchesSearch && matchesAction;
  });

  const handleExportCsv = () => {
    const header = ['ID,TenantID,Timestamp,Accion,Usuario,RecursoTipo,RecursoID,IP,Detalles,HashEvento\n'];
    const rows = filteredLogs.map(l => 
      `"${l.id}","${l.tenantId}","${l.timestamp}","${l.accion}","${l.userNombre}","${l.recursoTipo}","${l.recursoId}","${l.ipAddress}","${l.detalles.replace(/"/g, '""')}","${l.hashEvento}"`
    );
    const blob = new Blob([header.concat(rows.join('\n')).join('')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Auditoria_${tenant.id}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-emerald-400" />
            <span>Registro de Auditoría e Inmutabilidad (Audit Trail)</span>
          </h2>
          <p className="text-xs text-slate-400">
            Trazabilidad criptográfica de todos los accesos, firmas y eventos de seguridad para {tenant.nombreFantasia}.
          </p>
        </div>
        <button
          onClick={handleExportCsv}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#143452] hover:bg-[#1a4166] text-slate-200 text-xs font-semibold border border-[#214b73] transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>Exportar Log Autorizado (CSV)</span>
        </button>
      </div>

      {/* Compliance Note */}
      <div className="p-3.5 rounded-xl bg-[#091726] border border-[#163554] text-xs text-slate-300 flex items-start gap-3">
        <Lock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-[11px] leading-relaxed">
          <strong className="text-white">Conformidad con la Ley N° 19.628 y Ley N° 21.719 (Protección de Datos Personales):</strong>{' '}
          Los registros de auditoría no almacenan contraseñas, tokens de sesión completos ni datos biométricos sensibles en texto plano. Cada evento es sellado con marca temporal UTC y hash encadenado inmutable para prevenir alteraciones forenses.
        </div>
      </div>

      {/* Filter bar */}
      <div className="p-3.5 rounded-xl bg-[#0c1e30] border border-[#1b3b5c] flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por usuario, acción, recurso o detalle..."
            className="w-full bg-[#081522] border border-[#193552] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div className="text-xs">
          <select
            aria-label="Filtrar por tipo de acción"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-[#081522] border border-[#193552] text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none text-xs cursor-pointer"
          >
            <option value="all">Todas las Acciones</option>
            <option value="DOCUMENT_CREATED">Creación de Documento</option>
            <option value="SIGNATURE_ACCEPTED">Firma Aceptada</option>
            <option value="SIGNATURE_REJECTED">Firma Rechazada</option>
            <option value="EPP_DELIVERY_RECORDED">Entrega de EPP</option>
            <option value="WORKER_REGISTERED">Registro Trabajador</option>
            <option value="CROSS_TENANT_ACCESS_BLOCKED">Violación RLS Bloqueada</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-xl bg-[#0c1e30] border border-[#1b3b5c] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#183654] bg-[#091724] text-slate-400 text-[10px] uppercase tracking-wider">
                <th className="py-3 px-3.5">Fecha UTC & CLT</th>
                <th className="py-3 px-3">Acción</th>
                <th className="py-3 px-3">Usuario Responsable</th>
                <th className="py-3 px-3">Detalle del Evento</th>
                <th className="py-3 px-3">IP / Origen</th>
                <th className="py-3 px-3 text-right">Hash Evento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#152e47] text-slate-300">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No hay eventos de auditoría que coincidan con el filtro.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isViolation = log.accion.includes('BLOCKED') || log.accion.includes('ATTACK');
                  const isSign = log.accion.includes('SIGNATURE_ACCEPTED');

                  return (
                    <tr key={log.id} className="hover:bg-[#0e243a] transition-colors">
                      <td className="py-3 px-3.5 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                        <div className="text-slate-200 font-semibold">{log.timestamp.slice(0, 19).replace('T', ' ')} UTC</div>
                        <div className="text-slate-400">CLT Santiago</div>
                      </td>

                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isViolation
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : isSign
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-[#132d47] text-cyan-300 border border-cyan-800/40'
                        }`}>
                          {log.accion}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <p className="font-semibold text-white">{log.userNombre}</p>
                        <p className="text-[10px] text-slate-400">{log.userEmail}</p>
                      </td>

                      <td className="py-3 px-3 max-w-xs">
                        <p className="text-slate-200 leading-snug truncate">
                          {log.detalles}
                        </p>
                        <span className="text-[10px] font-mono text-cyan-400">
                          Recurso: {log.recursoId}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono text-[10px] text-slate-400">
                        {log.ipAddress}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-[10px] text-slate-400">
                        {log.hashEvento.slice(0, 12)}...
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
