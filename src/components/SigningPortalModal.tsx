import React, { useRef, useState, useEffect } from 'react';
import { 
  X, 
  PenTool, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  FileText, 
  Download, 
  AlertTriangle,
  Lock,
  Smartphone,
  Eye
} from 'lucide-react';
import { Document, Signer, SignatureEvidence } from '../types';
import { calculateSha256, formatChileanTimestamp, generateVerificationCode } from '../utils/crypto';
import { generateEvidenceCertificatePdf, generateSignedDocumentPdf } from '../utils/pdfGenerator';
import { storage } from '../services/mockStorage';

interface SigningPortalModalProps {
  document: Document;
  signerToSign?: Signer;
  onClose: () => void;
  onSignedSuccess: (updatedDoc: Document) => void;
}

export const SigningPortalModal: React.FC<SigningPortalModalProps> = ({
  document: initialDoc,
  signerToSign,
  onClose,
  onSignedSuccess,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [cedulaSerie, setCedulaSerie] = useState('');
  const [acceptedConsent, setAcceptedConsent] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedDoc, setCompletedDoc] = useState<Document | null>(
    initialDoc.estado === 'firmado' ? initialDoc : null
  );

  // Signer actual a firmar
  const currentSigner = signerToSign || 
    initialDoc.firmantes.find(f => f.estado === 'pendiente') || 
    initialDoc.firmantes[0];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Ajustar resolución retina
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    ctx.strokeStyle = '#0f2942'; // Tinta azul petróleo sobria
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [completedDoc, showRejectForm]);

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleConfirmSignature = async () => {
    if (!acceptedConsent) {
      alert('Debe aceptar expresamente la declaración de firma electrónica simple.');
      return;
    }
    if (!hasDrawn) {
      alert('Por favor dibuje su firma en el panel interactivo.');
      return;
    }

    setIsProcessing(true);

    try {
      const canvas = canvasRef.current;
      const signatureDataUrl = canvas ? canvas.toDataURL('image/png') : '';
      const nowIso = new Date().toISOString();
      const timeInfo = formatChileanTimestamp(nowIso);

      // Calcular hash con los datos del firmante
      const verificationSeed = `${initialDoc.id}-${currentSigner.rut}-${nowIso}-${signatureDataUrl.length}`;
      const finalHash = await calculateSha256(initialDoc.contenidoTexto + verificationSeed);
      const verificationCode = generateVerificationCode();

      // Actualizar firmantes
      const updatedSigners: Signer[] = initialDoc.firmantes.map((s) => {
        if (s.id === currentSigner.id) {
          return {
            ...s,
            estado: 'firmado',
            fechaFirmaUtc: nowIso,
            fechaFirmaClt: timeInfo.clt,
            firmaImagenDataUrl: signatureDataUrl,
            cedulaSerie: cedulaSerie.trim() || 'CL-DECLARADA',
            ipAddress: '190.161.42.115',
            userAgent: navigator.userAgent,
            metodoVerificacion: 'DECLARACION_JURADA_CEDULA',
          };
        }
        return s;
      });

      const allSigned = updatedSigners.every((s) => s.estado === 'firmado');

      const evidence: SignatureEvidence = {
        signatureRequestId: `sr-${initialDoc.id}`,
        documentId: initialDoc.id,
        documentVersion: initialDoc.version,
        documentHashSha256: finalHash,
        verificationCode: verificationCode,
        textoAceptacionVersion: 'v2.4-CL-LEY19799-DT',
        firmantes: updatedSigners,
        timestampUtc: nowIso,
        timestampClt: timeInfo.clt,
        certificadoGeneradoAt: nowIso,
        legalNotice: 'Documento suscrito bajo la Ley 19.799 de Chile. Evidencias técnicas registradas inmutablemente.',
      };

      const updatedDoc: Document = {
        ...initialDoc,
        estado: allSigned ? 'firmado' : 'pendiente',
        hashSha256: finalHash,
        firmantes: updatedSigners,
        evidencia: allSigned ? evidence : undefined,
        fechaCompletado: allSigned ? nowIso : undefined,
      };

      storage.updateDocument(updatedDoc);

      // Registrar auditoría
      storage.addAuditLog({
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        tenantId: initialDoc.tenantId,
        userNombre: currentSigner.nombreCompleto,
        userEmail: currentSigner.email,
        accion: 'SIGNATURE_ACCEPTED',
        recursoTipo: 'SIGNATURE',
        recursoId: initialDoc.id,
        detalles: `Firma Electrónica Simple registrada por ${currentSigner.nombreCompleto} (RUT: ${currentSigner.rut}). Código: ${verificationCode}`,
        ipAddress: '190.161.42.115',
        timestamp: nowIso,
        hashEvento: finalHash,
      });

      setCompletedDoc(updatedDoc);
      onSignedSuccess(updatedDoc);
    } catch (err) {
      console.error('Error al registrar firma:', err);
      alert('Ocurrió un error al procesar la firma.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectSignature = () => {
    if (!rejectReason.trim()) {
      alert('Debe ingresar el motivo de rechazo del documento.');
      return;
    }

    const nowIso = new Date().toISOString();
    const updatedSigners: Signer[] = initialDoc.firmantes.map((s) => {
      if (s.id === currentSigner.id) {
        return {
          ...s,
          estado: 'rechazado',
          motivoRechazo: rejectReason.trim(),
          fechaFirmaUtc: nowIso,
        };
      }
      return s;
    });

    const updatedDoc: Document = {
      ...initialDoc,
      estado: 'rechazado',
      firmantes: updatedSigners,
    };

    storage.updateDocument(updatedDoc);

    storage.addAuditLog({
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      tenantId: initialDoc.tenantId,
      userNombre: currentSigner.nombreCompleto,
      userEmail: currentSigner.email,
      accion: 'SIGNATURE_REJECTED',
      recursoTipo: 'DOCUMENT',
      recursoId: initialDoc.id,
      detalles: `Solicitud de firma RECHAZADA por ${currentSigner.nombreCompleto}. Motivo: ${rejectReason.trim()}`,
      ipAddress: '190.161.42.115',
      timestamp: nowIso,
      hashEvento: initialDoc.hashSha256,
    });

    onSignedSuccess(updatedDoc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#0b1b2d] border border-[#1e3c5c] rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header modal */}
        <div className="px-5 py-3.5 bg-[#0f2842] border-b border-[#1b3d60] flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight">
                Portal Seguro de Firma Electrónica Simple (FES)
              </h3>
              <p className="text-[11px] text-slate-300">
                Sujeto al Art. 3° de la Ley N° 19.799 y doctrina de la Dirección del Trabajo de Chile
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body modal */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 text-slate-200">
          {/* Si ya está completado con éxito */}
          {completedDoc && completedDoc.estado === 'firmado' ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">
                  ¡Documento Suscrito Exitosamente!
                </h4>
                <p className="text-xs text-slate-300 max-w-md mx-auto mt-1">
                  Se ha registrado el consentimiento formal, el trazo biométrico y las evidencias técnicas requeridas por la ley chilena.
                </p>
              </div>

              {completedDoc.evidencia && (
                <div className="p-4 rounded-lg bg-[#0e2439] border border-[#1a3d60] text-left max-w-lg mx-auto space-y-2 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-[#1b3b5c]">
                    <span className="text-slate-400">Código de Verificación:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {completedDoc.evidencia.verificationCode}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-[#1b3b5c]">
                    <span className="text-slate-400">Hash SHA-256:</span>
                    <span className="font-mono text-[10px] text-cyan-300 truncate max-w-[240px]">
                      {completedDoc.evidencia.documentHashSha256}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Sello de Tiempo:</span>
                    <span className="text-[11px] text-slate-200">
                      {completedDoc.evidencia.timestampClt}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                {completedDoc.evidencia && (
                  <button
                    onClick={() => generateEvidenceCertificatePdf(completedDoc, completedDoc.evidencia!)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0c5c46] hover:bg-[#0a4d3a] text-white text-xs font-bold transition-all shadow cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar Certificado de Evidencia</span>
                  </button>
                )}
                <button
                  onClick={() => generateSignedDocumentPdf(completedDoc)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#143d63] hover:bg-[#103252] text-white text-xs font-bold transition-all shadow cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Descargar Documento Firmado</span>
                </button>
              </div>
            </div>
          ) : showRejectForm ? (
            /* Formulario de Rechazo */
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-red-950/30 border border-red-800/40 text-red-200 text-xs flex gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Rechazo Formal de Documento</p>
                  <p className="text-[11px] text-red-300/80 mt-0.5">
                    Al rechazar este documento, la solicitud quedará cancelada y se notificará al empleador y administradores con su justificación.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Motivo o justificación del rechazo:
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explique las discrepancias en el texto, remuneraciones, jornada o cargos..."
                  rows={4}
                  className="w-full bg-[#0e2236] border border-[#1d3d5f] rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  onClick={() => setShowRejectForm(false)}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#12283d] text-slate-300 hover:bg-[#1a3854]"
                >
                  Cancelar y Volver
                </button>
                <button
                  onClick={handleRejectSignature}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-red-700 hover:bg-red-800 text-white shadow"
                >
                  Confirmar Rechazo
                </button>
              </div>
            </div>
          ) : (
            /* Vista Normal de Firma */
            <>
              {/* Información del documento */}
              <div className="p-3.5 rounded-lg bg-[#0e2439] border border-[#1b3a59] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white text-sm">
                    {initialDoc.titulo}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-900/40 text-cyan-300 border border-cyan-700/40 uppercase">
                    {initialDoc.categoria}
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  {initialDoc.descripcion}
                </p>
                <div className="text-[11px] text-slate-400 flex flex-wrap gap-4 pt-1 font-mono">
                  <span>ID: {initialDoc.id}</span>
                  <span>Versión: {initialDoc.version}</span>
                  <span>Hash previo: {initialDoc.hashSha256.slice(0, 16)}...</span>
                </div>
              </div>

              {/* Previsualización del texto completo */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Revisión íntegra del contenido del documento:</span>
                  <span className="text-[10px] font-normal text-slate-400">Lectura requerida</span>
                </label>
                <div className="p-3 rounded-lg bg-[#091522] border border-[#17314a] max-h-48 overflow-y-auto text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap select-text">
                  {initialDoc.contenidoTexto || 'Documento sin texto directo (Archivo adjunto PDF).'}
                </div>
              </div>

              {/* Datos de identificación del firmante */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-lg bg-[#0e2439] border border-[#1b3a59]">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">
                    Firmante
                  </span>
                  <p className="text-xs font-bold text-white mt-0.5">
                    {currentSigner.nombreCompleto}
                  </p>
                  <p className="text-xs text-cyan-300 font-mono">
                    RUT: {currentSigner.rut}
                  </p>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    N° de Serie Cédula de Identidad (Opcional - Evidencia técnica):
                  </label>
                  <input
                    type="text"
                    value={cedulaSerie}
                    onChange={(e) => setCedulaSerie(e.target.value.toUpperCase())}
                    placeholder="Ej: A192038102"
                    className="w-full bg-[#0a1928] border border-[#1d3d5f] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                  <span className="text-[10px] text-slate-400">
                    Acredita posesión física del documento de identidad
                  </span>
                </div>
              </div>

              {/* Canvas para dibujar firma */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Dibuje su firma en la pantalla (Touch o Ratón):</span>
                  </label>
                  <button
                    onClick={clearCanvas}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Borrar trazo</span>
                  </button>
                </div>

                <div className="border-2 border-dashed border-[#22476d] rounded-xl overflow-hidden bg-white/95 relative shadow-inner">
                  <canvas
                    ref={canvasRef}
                    onPointerDown={startDrawing}
                    onPointerMove={draw}
                    onPointerUp={stopDrawing}
                    onPointerLeave={stopDrawing}
                    className="w-full h-36 cursor-crosshair signature-canvas"
                  />
                  {!hasDrawn && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-400 text-xs font-medium">
                      Presione y dibuje su firma aquí
                    </div>
                  )}
                  <div className="absolute bottom-1 right-2 text-[9px] text-slate-400 pointer-events-none">
                    FirmaDigital Chile Canvas
                  </div>
                </div>
              </div>

              {/* Declaración de consentimiento legal (Ley 19.799) */}
              <div className="p-3.5 rounded-lg bg-[#0e2842]/60 border border-cyan-800/40">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs leading-relaxed text-slate-300">
                  <input
                    type="checkbox"
                    checked={acceptedConsent}
                    onChange={(e) => setAcceptedConsent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-600 text-emerald-500 focus:ring-emerald-400 bg-[#091724]"
                  />
                  <span>
                    <strong className="text-white">Declaración de consentimiento expreso (Ley 19.799 Art. 3°):</strong> He leído y comprendido íntegramente el presente documento, ratifico mi identidad y consiento en suscribirlo mediante Firma Electrónica Simple, autorizando el registro inmutable de evidencias técnicas, fecha UTC/CLT, IP y hash SHA-256.
                  </span>
                </label>
              </div>

              {/* Botones de acción */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#1b3b5c]">
                <button
                  type="button"
                  onClick={() => setShowRejectForm(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 transition-colors cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Rechazar Documento</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-2 text-xs font-medium rounded-lg text-slate-300 hover:bg-[#12283d] transition-colors"
                  >
                    Cerrar
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmSignature}
                    disabled={isProcessing || !acceptedConsent || !hasDrawn}
                    className="flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 disabled:opacity-50 text-white shadow-md transition-all cursor-pointer"
                  >
                    {isProcessing ? (
                      <span>Calculando Hash SHA-256...</span>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Firmar y Sellar Documento</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
