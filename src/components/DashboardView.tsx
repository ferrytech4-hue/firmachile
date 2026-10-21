import React from 'react';
import { 
  FileCheck2, 
  Clock, 
  AlertCircle, 
  Users, 
  HardHat, 
  Wrench, 
  Plus, 
  ArrowUpRight, 
  ShieldCheck, 
  FileText,
  Download,
  ExternalLink,
  Lock
} from 'lucide-react';
import { Tenant, Document, Worker, AssetTool, EppDelivery } from '../types';
import { generateEvidenceCertificatePdf, generateSignedDocumentPdf } from '../utils/pdfGenerator';

interface DashboardViewProps {
  tenant: Tenant;
  documents: Document[];
  workers: Worker[];
  assets: AssetTool[];
  eppDeliveries: EppDelivery[];
  onOpenCreateDocument: () => void;
  onOpenSignDocument: (doc: Document) => void;
  onNavigateTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tenant,
  documents,
  workers,
  assets,
  eppDeliveries,
  onOpenCreateDocument,
  onOpenSignDocument,
  onNavigateTab,
}) => {
  const totalDocs = documents.length;
  const signedDocs = documents.filter((d) => d.estado === 'firmado').length;
  const pendingDocs = documents.filter((d) => d.estado === 'pendiente').length;
  const rejectedDocs = documents.filter((d) => d.estado === 'rechazado' || d.estado === 'vencido').length;

  const usagePercent = Math.min(100, Math.round((tenant.documentosConsumidosMes / tenant.limiteDocumentosMes) * 100));

  return (
    <div className="space-y-6">
      {/* Top Banner: Bienvenida y Estado SaaS */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-[#0c2e4e] via-[#0b2742] to-[#0a4235] border border-[#1a446c]/60 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              {tenant.nombreFantasia}
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              Suscripción {tenant.planId.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            RUT: <span className="font-mono text-cyan-300">{tenant.rut}</span> • Giro: {tenant.giro} • {tenant.comuna}, {tenant.region}
          </p>
          <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-300">
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              Conformidad Ley N° 19.799 & D.S. 594
            </span>
            <span className="text-slate-500">•</span>
            <span>Aislamiento RLS en PostgreSQL</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenCreateDocument}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Documento</span>
          </button>
          <button
            onClick={() => onNavigateTab('cargo')}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-[#14324f] hover:bg-[#1a3d60] text-slate-200 text-xs font-semibold border border-[#214b73] transition-all cursor-pointer"
          >
            <Wrench className="w-3.5 h-3.5 text-amber-400" />
            <span>Hoja de Cargo</span>
          </button>
          <button
            onClick={() => onNavigateTab('epp')}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-[#14324f] hover:bg-[#1a3d60] text-slate-200 text-xs font-semibold border border-[#214b73] transition-all cursor-pointer"
          >
            <HardHat className="w-3.5 h-3.5 text-emerald-400" />
            <span>Entrega EPP</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-[#0c1e30] border border-[#1b3b5c] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Documentos Totales
            </span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-cyan-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-2 font-mono">
            {totalDocs}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>En este período</span>
            <span className="text-cyan-400 font-semibold">{tenant.documentosConsumidosMes} mes</span>
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#0c1e30] border border-[#1b3b5c] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Firmados & Conformes
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-2 font-mono">
            {signedDocs}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Con sellado SHA-256 inmutable
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#0c1e30] border border-[#1b3b5c] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Pendientes de Firma
            </span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400 mt-2 font-mono">
            {pendingDocs}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            En espera de suscripción
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#0c1e30] border border-[#1b3b5c] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Nómina Trabajadores
            </span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-300 mt-2 font-mono">
            {workers.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {assets.length} herramientas en cargo
          </p>
        </div>
      </div>

      {/* Quota Gauge & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Consumo de Suscripción */}
        <div className="p-5 rounded-xl bg-[#0c1e30] border border-[#1b3b5c] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Consumo del Plan ({tenant.planId.toUpperCase()})
              </h3>
              <button
                onClick={() => onNavigateTab('subscription')}
                className="text-[11px] text-cyan-400 hover:underline flex items-center gap-0.5"
              >
                <span>Planes</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Documentos mensuales:</span>
                  <span className="font-semibold text-white font-mono">
                    {tenant.documentosConsumidosMes} / {tenant.limiteDocumentosMes} ({usagePercent}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#132c45] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      usagePercent > 80 ? 'bg-amber-400' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Almacenamiento S3 Privado:</span>
                  <span className="font-semibold text-white font-mono">
                    {tenant.almacenamientoUsadoMb} MB / {tenant.limiteAlmacenamientoMb} MB
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#132c45] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-cyan-500"
                    style={{ width: `${Math.round((tenant.almacenamientoUsadoMb / tenant.limiteAlmacenamientoMb) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-[#081522] border border-[#17334f] text-[11px] text-slate-400">
            Firma Electrónica Simple ilimitada incluida. Integración con FEA (Firma Avanzada) disponible bajo demanda.
          </div>
        </div>

        {/* Módulos de Operación Inmediata */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-[#0c1e30] border border-[#1b3b5c] shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
            Acciones Clave de Gestión Laboral
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div
              onClick={() => onNavigateTab('cargo')}
              className="p-3.5 rounded-lg bg-[#0e2439] border border-[#1b3c5e] hover:border-amber-500/50 transition-all cursor-pointer group"
            >
              <div className="p-2 w-fit rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-105 transition-transform">
                <Wrench className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white mt-2">
                Hojas de Cargo
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Asigna herramientas de pañol con código y firma de custodia.
              </p>
            </div>

            <div
              onClick={() => onNavigateTab('epp')}
              className="p-3.5 rounded-lg bg-[#0e2439] border border-[#1b3c5e] hover:border-emerald-500/50 transition-all cursor-pointer group"
            >
              <div className="p-2 w-fit rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition-transform">
                <HardHat className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white mt-2">
                Entrega de EPP (DS 594)
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Acredita entrega de casco, calzado y mascarillas ante fiscalización DT.
              </p>
            </div>

            <div
              onClick={() => onNavigateTab('verification')}
              className="p-3.5 rounded-lg bg-[#0e2439] border border-[#1b3c5e] hover:border-cyan-500/50 transition-all cursor-pointer group"
            >
              <div className="p-2 w-fit rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white mt-2">
                Verificador Público
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Comprueba hashes SHA-256 y certificados para inspectores y clientes.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Documentos Recientes de la Empresa */}
      <div className="p-5 rounded-xl bg-[#0c1e30] border border-[#1b3b5c] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">
              Documentos Recientes de {tenant.nombreFantasia}
            </h3>
            <p className="text-xs text-slate-400">
              Aislados estrictamente bajo el Tenant ID: <code className="text-cyan-300 font-mono">{tenant.id}</code>
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('documents')}
            className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
          >
            <span>Ver todos ({documents.length})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#183654] text-slate-400 text-[10px] uppercase tracking-wider">
                <th className="py-2.5 px-3">Documento</th>
                <th className="py-2.5 px-3">Categoría</th>
                <th className="py-2.5 px-3">Trabajador / Firmante</th>
                <th className="py-2.5 px-3">Estado</th>
                <th className="py-2.5 px-3">Fecha</th>
                <th className="py-2.5 px-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#152e47] text-slate-300">
              {documents.slice(0, 5).map((doc) => {
                const isSigned = doc.estado === 'firmado';
                const isPending = doc.estado === 'pendiente';
                return (
                  <tr key={doc.id} className="hover:bg-[#0f253d] transition-colors">
                    <td className="py-3 px-3">
                      <p className="font-bold text-white truncate max-w-[220px]">
                        {doc.titulo}
                      </p>
                      <span className="text-[10px] font-mono text-slate-400">
                        {doc.id} • Hash: {doc.hashSha256.slice(0, 10)}...
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#132d47] text-cyan-300 border border-cyan-800/40 uppercase">
                        {doc.categoria}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-200">
                        {doc.trabajadorNombre || doc.firmantes[0]?.nombreCompleto || 'Varios'}
                      </p>
                      <p className="text-[10px] font-mono text-slate-400">
                        {doc.trabajadorRut || doc.firmantes[0]?.rut || ''}
                      </p>
                    </td>
                    <td className="py-3 px-3">
                      {isSigned ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          FIRMADO
                        </span>
                      ) : isPending ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          PENDIENTE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30 uppercase">
                          {doc.estado}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-[11px] text-slate-400">
                      {doc.fechaCreacion.slice(0, 10)}
                    </td>
                    <td className="py-3 px-3 text-right space-x-1.5">
                      {isPending && (
                        <button
                          onClick={() => onOpenSignDocument(doc)}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors cursor-pointer"
                        >
                          Firmar ahora
                        </button>
                      )}
                      {isSigned && (
                        <>
                          {doc.evidencia && (
                            <button
                              onClick={() => generateEvidenceCertificatePdf(doc, doc.evidencia!)}
                              title="Descargar Certificado de Evidencia de Firma"
                              className="p-1 rounded bg-[#132c45] hover:bg-[#1b3d60] text-cyan-300 transition-colors inline-flex items-center"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => generateSignedDocumentPdf(doc)}
                            title="Descargar Documento Firmado"
                            className="p-1 rounded bg-[#132c45] hover:bg-[#1b3d60] text-emerald-300 transition-colors inline-flex items-center"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
