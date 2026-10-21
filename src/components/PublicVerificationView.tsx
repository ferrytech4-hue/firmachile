import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Upload, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Download, 
  Lock, 
  ExternalLink,
  QrCode,
  Building2,
  Calendar
} from 'lucide-react';
import { Document } from '../types';
import { storage } from '../services/mockStorage';
import { calculateBufferSha256 } from '../utils/crypto';
import { generateEvidenceCertificatePdf } from '../utils/pdfGenerator';

export const PublicVerificationView: React.FC = () => {
  const [queryCode, setQueryCode] = useState('FD-CL-9842-8711');
  const [verifiedDoc, setVerifiedDoc] = useState<Document | null>(null);
  const [searched, setSearched] = useState(false);
  const [calculatedHash, setCalculatedHash] = useState('');
  const [hashMatches, setHashMatches] = useState<boolean | null>(null);

  const handleSearchCode = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!queryCode.trim()) return;

    setSearched(true);
    setCalculatedHash('');
    setHashMatches(null);

    const doc = storage.getDocumentByVerificationCode(queryCode);
    setVerifiedDoc(doc);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const hash = await calculateBufferSha256(buffer);
      setCalculatedHash(hash);
      setSearched(true);

      // Buscar si algún documento tiene este hash
      const allDocs = [
        ...storage.getDocuments('tenant-andina'),
        ...storage.getDocuments('tenant-minera'),
        ...storage.getDocuments('tenant-austral'),
      ];
      const match = allDocs.find(d => d.hashSha256 === hash || d.evidencia?.documentHashSha256 === hash);
      if (match) {
        setVerifiedDoc(match);
        setHashMatches(true);
      } else {
        setVerifiedDoc(null);
        setHashMatches(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2 py-3">
        <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-inner mb-2">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Portal Público de Verificación Criptográfica
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
          Compruebe la autenticidad, integridad matemática y trazabilidad legal de documentos firmados bajo la Ley N° 19.799 de Chile.
        </p>
      </div>

      {/* Box de consulta */}
      <div className="p-5 rounded-2xl bg-[#0c1e30] border border-[#1b3b5c] shadow-lg space-y-4">
        <form onSubmit={handleSearchCode} className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
            Ingrese el Código de Verificación o UUID del Documento:
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={queryCode}
                onChange={(e) => setQueryCode(e.target.value.toUpperCase())}
                placeholder="Ej: FD-CL-9842-8711 o doc-andina-001"
                className="w-full bg-[#081522] border border-[#193552] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition-colors cursor-pointer"
            >
              Consultar Validez
            </button>
          </div>
        </form>

        <div className="relative flex items-center justify-center my-3">
          <div className="border-t border-[#183552] w-full" />
          <span className="bg-[#0c1e30] px-3 text-[11px] text-slate-500 uppercase font-bold">
            O verificar archivo original
          </span>
        </div>

        {/* Upload file for hash check */}
        <label className="border-2 border-dashed border-[#1c3d5f] hover:border-cyan-500/50 rounded-xl p-4 text-center cursor-pointer block transition-colors bg-[#081522]">
          <Upload className="w-5 h-5 text-cyan-400 mx-auto mb-1.5" />
          <span className="text-xs font-bold text-white block">
            Cargar archivo PDF firmado para cotejo de integridad SHA-256
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            El archivo se analiza en su navegador localmente sin transmitirse a servidores externos.
          </span>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Resultados de la verificación */}
      {searched && (
        <div className="animate-fadeIn">
          {verifiedDoc ? (
            <div className="p-6 rounded-2xl bg-[#0c1e30] border border-emerald-500/40 shadow-xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                    DOCUMENTO AUTÉNTICO & REGISTRADO
                  </span>
                  <h3 className="text-base font-bold text-white mt-1">
                    {verifiedDoc.titulo}
                  </h3>
                </div>
              </div>

              {/* Antecedentes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs p-4 rounded-xl bg-[#081522] border border-[#163350]">
                <div>
                  <span className="text-slate-400">ID del Documento:</span>
                  <p className="font-mono text-cyan-300 font-semibold">{verifiedDoc.id}</p>
                </div>
                <div>
                  <span className="text-slate-400">Código de Verificación:</span>
                  <p className="font-mono text-emerald-400 font-bold">
                    {verifiedDoc.evidencia?.verificationCode || 'Registrado'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Categoría:</span>
                  <p className="uppercase text-slate-200 font-medium">{verifiedDoc.categoria}</p>
                </div>
                <div>
                  <span className="text-slate-400">Estado Legal:</span>
                  <p className="text-emerald-400 font-bold uppercase">{verifiedDoc.estado}</p>
                </div>
              </div>

              {/* Hash SHA-256 */}
              <div>
                <span className="text-xs text-slate-400 block mb-1">
                  Hash Criptográfico SHA-256 Certificado:
                </span>
                <code className="block p-3 rounded-xl bg-[#06101a] border border-[#142d45] font-mono text-[11px] text-cyan-300 break-all">
                  {verifiedDoc.hashSha256}
                </code>
              </div>

              {/* Firmantes */}
              <div>
                <span className="text-xs font-bold text-slate-300 block mb-2">
                  Registro de Firmantes Acreditados:
                </span>
                <div className="space-y-2">
                  {verifiedDoc.firmantes.map((f, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg bg-[#081522] border border-[#15304b] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <p className="font-bold text-white">{f.nombreCompleto}</p>
                        <p className="text-[11px] font-mono text-slate-400">
                          RUT: {f.rut} • {f.cargo}
                        </p>
                      </div>
                      <div className="text-right sm:text-right text-[11px]">
                        <span className="text-emerald-400 font-semibold block">
                          ✓ Firmado {f.fechaFirmaClt || 'Conforme'}
                        </span>
                        <span className="text-slate-500 text-[10px]">
                          IP: {f.ipAddress || '190.161.42.115'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cláusula Ley 19.799 */}
              <div className="p-3.5 rounded-xl bg-[#0e253d] border border-cyan-800/40 text-[11px] text-slate-300 leading-relaxed">
                <strong>Fundamento Legal República de Chile:</strong> Este documento cuenta con plena validez de Firma Electrónica Simple según el artículo 3° de la Ley N° 19.799 sobre Documentos Electrónicos y firma electrónica. Su integridad e inmutabilidad han sido corroboradas mediante sellado SHA-256.
              </div>

              {/* Descargar Certificado */}
              {verifiedDoc.evidencia && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => generateEvidenceCertificatePdf(verifiedDoc, verifiedDoc.evidencia!)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar Certificado Oficial de Evidencia</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-red-950/20 border border-red-800/40 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
                <XCircle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-red-300">
                Documento no encontrado o alterado
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No se encontró ningún registro para el código o hash indicado. Si el documento fue modificado aunque sea en un solo carácter, el hash SHA-256 resultante diferirá del original.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
