import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Upload, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Shield,
  Layers,
  FileCheck
} from 'lucide-react';
import { Tenant, Worker, Document, DocumentCategory, SignatureType, Signer } from '../types';
import { calculateSha256, calculateBufferSha256, generateUUID } from '../utils/crypto';
import { formatRut, validateRut } from '../utils/rut';
import { storage } from '../services/mockStorage';

interface CreateDocumentModalProps {
  tenant: Tenant;
  workers: Worker[];
  onClose: () => void;
  onDocumentCreated: (newDoc: Document) => void;
}

export const CreateDocumentModal: React.FC<CreateDocumentModalProps> = ({
  tenant,
  workers,
  onClose,
  onDocumentCreated,
}) => {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [templateType, setTemplateType] = useState<string>('contrato_indefinido');
  const [titulo, setTitulo] = useState('Contrato de Trabajo a Plazo Indefinido');
  const [categoria, setCategoria] = useState<DocumentCategory>('contrato');
  const [tipoFirma, setTipoFirma] = useState<SignatureType>('simple');
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>(workers[0]?.id || '');
  const [customText, setCustomText] = useState('');
  const [fileName, setFileName] = useState('Contrato_Trabajo.pdf');
  const [fileSha256, setFileSha256] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Signers list
  const [signers, setSigners] = useState<Array<{
    rut: string;
    nombreCompleto: string;
    email: string;
    cargo: string;
    orden: number;
  }>>([
    {
      rut: workers[0]?.rut || '16.482.903-7',
      nombreCompleto: workers[0] ? `${workers[0].nombres} ${workers[0].apellidos}` : 'Rodrigo Muñoz Valenzuela',
      email: workers[0]?.email || 'rmunoz@empresa.cl',
      cargo: workers[0]?.cargo || 'Trabajador',
      orden: 1,
    },
    {
      rut: '10.920.311-5',
      nombreCompleto: 'Hernán Silva Díaz',
      email: 'gerencia@constructoraandina.cl',
      cargo: 'Representante Legal Empleador',
      orden: 2,
    }
  ]);

  // Manejar selección de plantilla
  const handleSelectTemplate = (tmpl: string) => {
    setTemplateType(tmpl);
    const worker = workers.find(w => w.id === selectedWorkerId) || workers[0];
    const wName = worker ? `${worker.nombres} ${worker.apellidos}` : 'TRABAJADOR';
    const wRut = worker ? worker.rut : 'XX.XXX.XXX-X';
    const wCargo = worker ? worker.cargo : 'Trabajador';
    const wFaena = worker ? worker.faenaUbicacion : 'Faena Central';

    if (tmpl === 'contrato_indefinido') {
      setTitulo(`Contrato de Trabajo a Plazo Indefinido - ${wName}`);
      setCategoria('contrato');
      setFileName(`Contrato_${wName.replace(/\s+/g, '_')}.pdf`);
      setCustomText(`CONTRATO DE TRABAJO A PLAZO INDEFINIDO
(Conforme al Artículo 10 del Código del Trabajo de Chile y Ley 21.561 de 40 Horas)

En la ciudad de Santiago de Chile, entre la empresa ${tenant.razonSocial}, Rol Único Tributario N° ${tenant.rut}, domiciliada en ${tenant.direccion}, Comuna de ${tenant.comuna}, representada legalmente por don Hernán Silva Díaz, cédula de identidad N° 10.920.311-5, en adelante "el Empleador"; y don(ña) ${wName}, cédula nacional de identidad N° ${wRut}, de nacionalidad chilena, domiciliado(a) en la ciudad de Santiago, en adelante "el Trabajador", se ha convenido el siguiente contrato de trabajo:

PRIMERO: De la función y lugar.
El Trabajador se compromete y obliga a desempeñar las labores y funciones inherentes al cargo de ${wCargo}, prestando servicios en las dependencias de ${wFaena}, o en cualquier otra faena dentro de la provincia respectiva según requerimiento operacional de la empresa.

SEGUNDO: De la jornada de trabajo.
La jornada ordinaria de trabajo será de 40 horas semanales distribuidas de lunes a viernes, en conformidad con la Ley N° 21.561.

TERCERO: De la remuneración.
El Empleador pagará al Trabajador un sueldo base mensual de $1.150.000 (un millón ciento cincuenta mil pesos) más gratificación legal calculada conforme al artículo 47 y 50 del Código del Trabajo. Las cotizaciones previsionales serán enteradas en la AFP y sistema de salud que legalmente correspondan.

CUARTO: Del régimen de firma electrónica.
Ambas partes acuerdan libre y expresamente suscribir el presente instrumento laboral mediante Firma Electrónica Simple, al amparo del artículo 3° de la Ley N° 19.799 y doctrina de la Dirección del Trabajo (Dictamen N° 789/15). Se acuerda que el empleador pondrá a disposición del trabajador una copia íntegra con sellado criptográfico.`);
    } else if (tmpl === 'anexo_jornada') {
      setTitulo(`Anexo de Modificación de Jornada y Turno - ${wName}`);
      setCategoria('anexo');
      setFileName(`Anexo_Jornada_${wName.replace(/\s+/g, '_')}.pdf`);
      setCustomText(`ANEXO DE CONTRATO DE TRABAJO: PACTO DE JORNADA

En Santiago, a fecha de suscripción electrónica, entre ${tenant.razonSocial} (RUT ${tenant.rut}) y don(ña) ${wName} (RUT ${wRut}).

PRIMERO: Las partes acuerdan modificar la Cláusula Segunda del contrato de trabajo vigente, estableciendo una adecuación de turnos operacionales para la faena ${wFaena}.
SEGUNDO: En todo lo no modificado expresamente por el presente anexo, permanecen plenamente vigentes las demás cláusulas del contrato individual de trabajo.
TERCERO: Suscrito electrónicamente según Ley 19.799.`);
    } else if (tmpl === 'hoja_cargo') {
      setTitulo(`Hoja de Cargo y Entrega de Herramientas - ${wName}`);
      setCategoria('hoja_cargo');
      setFileName(`Hoja_Cargo_${wName.replace(/\s+/g, '_')}.pdf`);
      setCustomText(`ACTA DE RECEPCIÓN Y HOJA DE CARGO DE HERRAMIENTAS Y EQUIPOS

EMPRESA: ${tenant.razonSocial} (RUT ${tenant.rut})
TRABAJADOR RECEPTOR: ${wName} (RUT ${wRut})
CARGO: ${wCargo} | FAENA: ${wFaena}

Por medio del presente instrumento, el trabajador declara recibir a su entera conformidad las siguientes herramientas para uso exclusivo y debido en sus funciones laborales:
1. Equipo mototool / taladro percutor según código de inventario asignado.
2. Juego de llaves y dados industriales de alta resistencia.

COMPROMISO: El trabajador asume la guarda y custodia diligente, comprometiéndose a restituirlos íntegramente al término de su asignación.`);
    } else if (tmpl === 'archivo_pdf') {
      setTitulo(`Documento PDF Creado por Empresa`);
      setCategoria('administrativo');
      setCustomText('Documento cargado desde archivo PDF con verificación de integridad SHA-256.');
    }
  };

  const handleWorkerChange = (workerId: string) => {
    setSelectedWorkerId(workerId);
    const worker = workers.find(w => w.id === workerId);
    if (worker) {
      // Actualizar primer firmante con este trabajador
      setSigners(prev => {
        const copy = [...prev];
        if (copy[0]) {
          copy[0] = {
            rut: worker.rut,
            nombreCompleto: `${worker.nombres} ${worker.apellidos}`,
            email: worker.email,
            cargo: worker.cargo,
            orden: 1,
          };
        }
        return copy;
      });
      // Regenerar texto si es plantilla
      handleSelectTemplate(templateType);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setUploadError('El archivo supera el límite permitido de 15 MB.');
      return;
    }

    setIsUploading(true);
    setUploadError('');
    try {
      const buffer = await file.arrayBuffer();
      const hash = await calculateBufferSha256(buffer);
      setFileSha256(hash);
      setFileName(file.name);
      setTitulo(file.name.replace(/\.[^/.]+$/, ''));
      setTemplateType('archivo_pdf');
    } catch {
      setUploadError('Error al procesar el archivo.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddSigner = () => {
    setSigners(prev => [
      ...prev,
      {
        rut: '',
        nombreCompleto: '',
        email: '',
        cargo: 'Firmante / Revisor',
        orden: prev.length + 1,
      }
    ]);
  };

  const handleRemoveSigner = (idx: number) => {
    setSigners(prev => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, orden: i + 1 })));
  };

  const handleSubmit = async () => {
    if (!titulo.trim()) {
      alert('Ingrese un título para el documento.');
      return;
    }

    // Validar firmantes
    for (const s of signers) {
      if (!s.nombreCompleto.trim()) {
        alert('Todos los firmantes deben tener un nombre.');
        return;
      }
      if (s.rut && !validateRut(s.rut)) {
        alert(`El RUT ingresado "${s.rut}" no es válido según Módulo 11 de Chile.`);
        return;
      }
    }

    // Calcular hash del contenido
    const textToHash = customText || `${titulo}-${fileName}-${Date.now()}`;
    const hash = fileSha256 || await calculateSha256(textToHash);

    const docId = `doc-${generateUUID().slice(0, 8)}`;
    const worker = workers.find(w => w.id === selectedWorkerId);

    const mappedSigners: Signer[] = signers.map((s, idx) => ({
      id: `sig-${docId}-${idx + 1}`,
      workerId: idx === 0 && worker ? worker.id : undefined,
      rut: formatRut(s.rut),
      nombreCompleto: s.nombreCompleto.trim(),
      email: s.email.trim(),
      cargo: s.cargo.trim(),
      ordenFirma: s.orden,
      estado: 'pendiente',
      tipoFirma: tipoFirma,
    }));

    const newDocument: Document = {
      id: docId,
      tenantId: tenant.id,
      titulo: titulo.trim(),
      categoria: categoria,
      tipoFirmaRequerida: tipoFirma,
      estado: 'pendiente',
      version: 1,
      hashSha256: hash,
      descripcion: `Documento generado para ${signers[0]?.nombreCompleto || 'trabajador'}`,
      contenidoTexto: customText,
      tamanoBytes: customText.length * 2 + 65000,
      nombreArchivo: fileName,
      creadoPorUsuarioId: 'u-current',
      creadoPorNombre: 'Administrador de Empresa',
      trabajadorDestinatarioId: worker?.id,
      trabajadorNombre: worker ? `${worker.nombres} ${worker.apellidos}` : undefined,
      trabajadorRut: worker?.rut,
      firmantes: mappedSigners,
      fechaCreacion: new Date().toISOString(),
      fechaVencimiento: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
    };

    storage.addDocument(newDocument);
    onDocumentCreated(newDocument);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#0b1c2e] border border-[#1d3d5f] rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header modal */}
        <div className="px-5 py-3.5 bg-[#0f2942] border-b border-[#1b3d60] flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight">
                Crear Nuevo Documento Electrónico
              </h3>
              <p className="text-[11px] text-slate-300">
                {tenant.razonSocial} (RUT {tenant.rut})
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

        {/* Stepper */}
        <div className="px-6 py-2.5 bg-[#081522] border-b border-[#183552] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              activeStep === 1 ? 'bg-emerald-500 text-white' : 'bg-[#152e47] text-slate-300'
            }`}>1</span>
            <span className={activeStep === 1 ? 'text-white font-bold' : ''}>Plantilla & Tipo</span>
          </div>
          <span className="text-slate-600">→</span>
          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              activeStep === 2 ? 'bg-emerald-500 text-white' : 'bg-[#152e47] text-slate-300'
            }`}>2</span>
            <span className={activeStep === 2 ? 'text-white font-bold' : ''}>Contenido</span>
          </div>
          <span className="text-slate-600">→</span>
          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              activeStep === 3 ? 'bg-emerald-500 text-white' : 'bg-[#152e47] text-slate-300'
            }`}>3</span>
            <span className={activeStep === 3 ? 'text-white font-bold' : ''}>Firmantes & Envío</span>
          </div>
        </div>

        {/* Modal content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-slate-200">
          {/* STEP 1: Selección de plantilla y modalidad */}
          {activeStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Seleccione una plantilla laboral chilena o cargue su archivo:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleSelectTemplate('contrato_indefinido')}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      templateType === 'contrato_indefinido'
                        ? 'bg-[#0e3a5a] border-emerald-500/60 shadow-sm'
                        : 'bg-[#0d2134] border-[#1c3c5c] hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-white">Contrato Indefinido</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">DT Art. 10</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Cláusulas de jornada 40 horas, remuneración, gratificación y previsión.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectTemplate('anexo_jornada')}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      templateType === 'anexo_jornada'
                        ? 'bg-[#0e3a5a] border-emerald-500/60 shadow-sm'
                        : 'bg-[#0d2134] border-[#1c3c5c] hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-white">Anexo de Contrato</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">Pacto DT</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Modificación de jornada, teletrabajo o cambio de faena / obra.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectTemplate('hoja_cargo')}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      templateType === 'hoja_cargo'
                        ? 'bg-[#0e3a5a] border-emerald-500/60 shadow-sm'
                        : 'bg-[#0d2134] border-[#1c3c5c] hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-white">Hoja de Cargo Herramientas</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">Custodia</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Asignación individual con códigos, números de serie y compromiso de devolución.
                    </p>
                  </button>

                  <label className={`p-3 rounded-lg border text-left transition-all cursor-pointer block ${
                    templateType === 'archivo_pdf'
                      ? 'bg-[#0e3a5a] border-emerald-500/60 shadow-sm'
                      : 'bg-[#0d2134] border-[#1c3c5c] hover:border-slate-500'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-white">Cargar Archivo PDF Propio</span>
                      <Upload className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Calcula el hash SHA-256 criptográfico de su archivo local.
                    </p>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Selector de trabajador vinculado */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Trabajador destinatario (Nómina de {tenant.nombreFantasia}):
                </label>
                <select
                  aria-label="Seleccionar trabajador destinatario"
                  value={selectedWorkerId}
                  onChange={(e) => handleWorkerChange(e.target.value)}
                  className="w-full bg-[#0e2236] border border-[#1d3d5f] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.nombres} {w.apellidos} — RUT: {w.rut} ({w.cargo})
                    </option>
                  ))}
                </select>
              </div>

              {/* Modalidad de Firma (Simple vs Avanzada) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Nivel de Firma Electrónica exigido por documento:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div
                    onClick={() => setTipoFirma('simple')}
                    className={`p-3 rounded-lg border cursor-pointer ${
                      tipoFirma === 'simple'
                        ? 'bg-[#0e3a5a] border-emerald-500/80 shadow'
                        : 'bg-[#0d2134] border-[#1c3c5c]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">Firma Electrónica Simple (FES)</span>
                      <span className="text-[10px] font-bold text-emerald-400">OPERATIVA</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1">
                      Art. 3° Ley 19.799. Válida para contratos laborales, anexos, EPP y hojas de cargo.
                    </p>
                  </div>

                  <div
                    onClick={() => setTipoFirma('avanzada')}
                    className={`p-3 rounded-lg border cursor-pointer ${
                      tipoFirma === 'avanzada'
                        ? 'bg-[#0e3a5a] border-cyan-500/80 shadow'
                        : 'bg-[#0d2134] border-[#1c3c5c]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">Firma Avanzada (FEA)</span>
                      <span className="text-[10px] font-bold text-cyan-400">FASE INTEGRACIÓN</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1">
                      Conexión desacoplada con entidad acreditadora en Chile (Acepta, E-Sign, Certinet).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Revisión y edición de contenido */}
          {activeStep === 2 && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Título del documento:
                </label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full bg-[#0e2236] border border-[#1d3d5f] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex justify-between">
                  <span>Texto o contenido formal del documento:</span>
                  <span className="text-[10px] text-slate-400">Editable antes de enviar</span>
                </label>
                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  rows={10}
                  className="w-full bg-[#091522] border border-[#17314a] rounded-lg p-3 text-xs text-slate-300 font-mono leading-relaxed focus:outline-none focus:border-cyan-400"
                />
              </div>

              {fileSha256 && (
                <div className="p-2.5 rounded-lg bg-[#0e2439] border border-[#1b3a59] text-xs">
                  <span className="text-slate-400">Hash SHA-256 precalculado: </span>
                  <code className="text-cyan-300 font-mono text-[11px]">{fileSha256}</code>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Configuración de firmantes */}
          {activeStep === 3 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300">
                  Firmantes requeridos y orden secuencial:
                </label>
                <button
                  type="button"
                  onClick={handleAddSigner}
                  className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Firmante</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {signers.map((signer, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-[#0e2236] border border-[#1c3c5c] grid grid-cols-1 sm:grid-cols-12 gap-2 items-center text-xs"
                  >
                    <div className="sm:col-span-1 flex items-center justify-center font-bold text-emerald-400 bg-emerald-950/60 w-6 h-6 rounded-full border border-emerald-800">
                      {signer.orden}
                    </div>

                    <div className="sm:col-span-3">
                      <input
                        type="text"
                        value={signer.nombreCompleto}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSigners(prev => prev.map((s, i) => i === idx ? { ...s, nombreCompleto: val } : s));
                        }}
                        placeholder="Nombre completo"
                        className="w-full bg-[#0a1826] border border-[#1a3854] rounded px-2 py-1 text-white text-xs"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <input
                        type="text"
                        value={signer.rut}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSigners(prev => prev.map((s, i) => i === idx ? { ...s, rut: val } : s));
                        }}
                        placeholder="RUT (ej: 16.482.903-7)"
                        className="w-full bg-[#0a1826] border border-[#1a3854] rounded px-2 py-1 text-cyan-300 font-mono text-xs"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <input
                        type="email"
                        value={signer.email}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSigners(prev => prev.map((s, i) => i === idx ? { ...s, email: val } : s));
                        }}
                        placeholder="Correo electrónico"
                        className="w-full bg-[#0a1826] border border-[#1a3854] rounded px-2 py-1 text-slate-300 text-xs"
                      />
                    </div>

                    <div className="sm:col-span-2 flex items-center justify-between gap-1">
                      <span className="text-[10px] text-slate-400 truncate">{signer.cargo}</span>
                      {signers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSigner(idx)}
                          className="p-1 text-slate-400 hover:text-red-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-lg bg-[#0e2842]/40 border border-[#1c4066] text-xs text-slate-300 space-y-1">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Seguridad de Envío y Trazabilidad</span>
                </p>
                <p className="text-[11px] text-slate-400">
                  Al emitir la solicitud, se generará un enlace protegido de un solo uso por firmante, notificando vía correo y registrando cada apertura y confirmación con sello de tiempo.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="px-5 py-3 bg-[#0f2842] border-t border-[#1b3d60] flex items-center justify-between">
          {activeStep > 1 ? (
            <button
              type="button"
              onClick={() => setActiveStep((prev) => (prev - 1) as any)}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#12283d] text-slate-300 hover:bg-[#1a3854]"
            >
              Anterior
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium rounded-lg text-slate-300 hover:bg-[#12283d]"
            >
              Cancelar
            </button>

            {activeStep < 3 ? (
              <button
                type="button"
                onClick={() => {
                  if (activeStep === 1 && !customText) {
                    handleSelectTemplate(templateType);
                  }
                  setActiveStep((prev) => (prev + 1) as any);
                }}
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow"
              >
                Continuar
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="px-5 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white shadow-md cursor-pointer"
              >
                Crear y Enviar a Firma
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
