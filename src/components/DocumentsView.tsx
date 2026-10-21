import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Plus, 
  Download, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Copy, 
  Check, 
  ExternalLink,
  ShieldCheck,
  Eye,
  FileCheck
} from 'lucide-react';
import { Document, DocumentCategory, DocumentStatus } from '../types';
import { generateEvidenceCertificatePdf, generateSignedDocumentPdf } from '../utils/pdfGenerator';

interface DocumentsViewProps {
  documents: Document[];
  onOpenCreateDocument: () => void;
  onOpenSignDocument: (doc: Document) => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  documents,
  onOpenCreateDocument,
  onOpenSignDocument,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [copiedDocId, setCopiedDocId] = useState<string | null>(null);
  const [selectedDocForDetail, setSelectedDocForDetail] = useState<Document | null>(null);

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = 
      doc.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.trabajadorNombre && doc.trabajadorNombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (doc.trabajadorRut && doc.trabajadorRut.includes(searchTerm)) ||
      doc.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || doc.categoria === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || doc.estado === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleCopyLink = (docId: string) => {
    const link = `${window.location.origin}/#firmar/${docId}`;
    navigator.clipboard.writeText(link);
    setCopiedDocId(docId);
    setTimeout(() => setCopiedDocId(null), 2500);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Gestión Documental y Solicitudes de Firma
          </h2>
          <p className="text-xs text-slate-400">
            Administre contratos laborales, anexos, actas y hojas de cargo con trazabilidad legal inmutable.
          </p>
        </div>
        <button
          onClick={onOpenCreateDocument}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Documento</span>
        </button>
      </div>

      {/* Filters bar */}
      <div className="p-3.5 rounded-xl bg-[#0c1e30] border border-[#1b3b5c] flex flex-wrap gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título, trabajador, RUT o ID de documento..."
            className="w-full bg-[#081522] border border-[#193552] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Categoría */}
        <div className="flex items-center gap-1.5 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            aria-label="Filtrar por categoría"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#081522] border border-[#193552] text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none text-xs cursor-pointer"
          >
            <option value="all">Todas las Categorías</option>
            <option value="contrato">Contratos Laborales</option>
            <option value="anexo">Anexos y Pactos DT</option>
            <option value="hoja_cargo">Hojas de Cargo (Herramientas)</option>
            <option value="epp">Comprobantes EPP (D.S. 594)</option>
            <option value="administrativo">Administrativos</option>
          </select>
        </div>

        {/* Estado */}
        <div className="text-xs">
          <select
            aria-label="Filtrar por estado"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-[#081522] border border-[#193552] text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none text-xs cursor-pointer"
          >
            <option value="all">Todos los Estados</option>
            <option value="pendiente">Pendientes de Firma</option>
            <option value="firmado">Firmados</option>
            <option value="rechazado">Rechazados</option>
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="rounded-xl bg-[#0c1e30] border border-[#1b3b5c] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#183654] bg-[#091724] text-slate-400 text-[10px] uppercase tracking-wider">
                <th className="py-3 px-3.5">Título y Versión</th>
                <th className="py-3 px-3">Categoría</th>
                <th className="py-3 px-3">Modalidad</th>
                <th className="py-3 px-3">Firmantes & Estado</th>
                <th className="py-3 px-3">Emisión / Vencimiento</th>
                <th className="py-3 px-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#152e47] text-slate-300">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No se encontraron documentos que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => {
                  const isSigned = doc.estado === 'firmado';
                  const isPending = doc.estado === 'pendiente';
                  const isRejected = doc.estado === 'rechazado';

                  return (
                    <tr key={doc.id} className="hover:bg-[#0e243a] transition-colors">
                      <td className="py-3 px-3.5">
                        <div className="flex items-start gap-2.5">
                          <div className={`p-1.5 rounded-lg mt-0.5 ${
                            isSigned ? 'bg-emerald-500/10 text-emerald-400' : 'bg-cyan-500/10 text-cyan-400'
                          }`}>
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-white max-w-xs truncate">
                              {doc.titulo}
                            </p>
                            <p className="text-[10px] font-mono text-slate-400">
                              ID: {doc.id} (v{doc.version})
                            </p>
                            <p className="text-[9.5px] font-mono text-cyan-400/80">
                              Hash: {doc.hashSha256.slice(0, 16)}...
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#132d47] text-cyan-300 border border-cyan-800/40 uppercase">
                          {doc.categoria}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        {doc.tipoFirmaRequerida === 'simple' ? (
                          <span className="text-[11px] text-slate-300 font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Firma Simple
                          </span>
                        ) : (
                          <span className="text-[11px] text-cyan-300 font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                            Firma Avanzada
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          {doc.firmantes.map((s, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                              {s.estado === 'firmado' ? (
                                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                              ) : s.estado === 'rechazado' ? (
                                <XCircle className="w-3 h-3 text-red-400 shrink-0" />
                              ) : (
                                <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                              )}
                              <span className="truncate max-w-[140px] text-slate-200">
                                {s.nombreCompleto}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-[11px] text-slate-400">
                        <div>Emitido: {doc.fechaCreacion.slice(0, 10)}</div>
                        <div className="text-[10px]">Vence: {doc.fechaVencimiento.slice(0, 10)}</div>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Botón firmar si pendiente */}
                          {isPending && (
                            <button
                              onClick={() => onOpenSignDocument(doc)}
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors cursor-pointer"
                            >
                              Firmar
                            </button>
                          )}

                          {/* Copiar enlace para firmante */}
                          <button
                            onClick={() => handleCopyLink(doc.id)}
                            title="Copiar enlace seguro para el firmante"
                            className="p-1.5 rounded bg-[#132c45] hover:bg-[#1b3d60] text-slate-300 transition-colors"
                          >
                            {copiedDocId === doc.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Descargar Certificado de Evidencia */}
                          {isSigned && doc.evidencia && (
                            <button
                              onClick={() => generateEvidenceCertificatePdf(doc, doc.evidencia!)}
                              title="Descargar Certificado de Evidencia de Firma Electrónica"
                              className="p-1.5 rounded bg-[#132c45] hover:bg-[#1b3d60] text-cyan-300 transition-colors"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Descargar Documento Firmado */}
                          {isSigned && (
                            <button
                              onClick={() => generateSignedDocumentPdf(doc)}
                              title="Descargar Documento Firmado con sello al pie"
                              className="p-1.5 rounded bg-[#132c45] hover:bg-[#1b3d60] text-emerald-300 transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Ver detalles */}
                          <button
                            onClick={() => setSelectedDocForDetail(doc)}
                            title="Ver detalle del documento"
                            className="p-1.5 rounded bg-[#132c45] hover:bg-[#1b3d60] text-slate-400 hover:text-white transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalle de Documento */}
      {selectedDocForDetail && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0b1c2e] border border-[#1e3c5c] rounded-xl w-full max-w-2xl p-5 shadow-2xl space-y-4 text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#183654]">
              <h3 className="font-bold text-white text-sm">
                Ficha Técnica del Documento
              </h3>
              <button
                onClick={() => setSelectedDocForDetail(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400">Título:</span>
                  <p className="font-bold text-white">{selectedDocForDetail.titulo}</p>
                </div>
                <div>
                  <span className="text-slate-400">Categoría:</span>
                  <p className="uppercase text-cyan-300 font-semibold">{selectedDocForDetail.categoria}</p>
                </div>
                <div>
                  <span className="text-slate-400">ID Único:</span>
                  <p className="font-mono text-slate-300">{selectedDocForDetail.id}</p>
                </div>
                <div>
                  <span className="text-slate-400">Estado:</span>
                  <p className="font-bold uppercase text-emerald-400">{selectedDocForDetail.estado}</p>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Hash SHA-256 Criptográfico:</span>
                <code className="block p-2 rounded bg-[#07131f] border border-[#16304a] text-[11px] text-cyan-300 break-all font-mono">
                  {selectedDocForDetail.hashSha256}
                </code>
              </div>

              {selectedDocForDetail.evidencia && (
                <div className="p-3 rounded-lg bg-[#0e253c] border border-[#1c3d5f] space-y-1.5">
                  <span className="font-bold text-emerald-400 block">
                    Evidencias Registradas de Firma:
                  </span>
                  <p>Código de Verificación: <strong className="text-white font-mono">{selectedDocForDetail.evidencia.verificationCode}</strong></p>
                  <p>Sello de Tiempo CLT: <span className="text-slate-300">{selectedDocForDetail.evidencia.timestampClt}</span></p>
                  <p>Sello de Tiempo UTC: <span className="text-slate-300">{selectedDocForDetail.evidencia.timestampUtc}</span></p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedDocForDetail(null)}
                className="px-4 py-1.5 bg-[#14324f] hover:bg-[#1b4066] text-white rounded-lg text-xs font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
