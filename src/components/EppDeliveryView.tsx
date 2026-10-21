import React, { useState } from 'react';
import { 
  HardHat, 
  Plus, 
  FileText, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { Tenant, Worker, EppDelivery, EppItem, Document } from '../types';
import { storage } from '../services/mockStorage';
import { generateEppReceiptPdf } from '../utils/pdfGenerator';
import { calculateSha256 } from '../utils/crypto';

interface EppDeliveryViewProps {
  tenant: Tenant;
  workers: Worker[];
  deliveries: EppDelivery[];
  onDocumentCreated: (doc: Document) => void;
  onOpenSignDocument: (doc: Document) => void;
}

export const EppDeliveryView: React.FC<EppDeliveryViewProps> = ({
  tenant,
  workers,
  deliveries,
  onDocumentCreated,
  onOpenSignDocument,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>(workers[0]?.id || '');
  const [supervisorName, setSupervisorName] = useState('Camila Soto Araya (Experta SNS)');
  const [faena, setFaena] = useState('Obra Edificio Mirador Oriente');

  // Ítems EPP estándar de Chile (D.S. 594 Art. 68)
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: boolean }>({
    casco: true,
    calzado: true,
    antiparras: true,
    guantes: true,
    chaleco: false,
    auditivo: false,
    respirador: false,
  });

  const availableEppCatalog: { [key: string]: EppItem } = {
    casco: {
      nombre: 'Casco de Seguridad Tipo I Clase E con Barbiquejo',
      tipo: 'cabeza',
      marca: 'MSA / Steelpro',
      modeloTalla: 'V-Gard Estándar',
      certificacionNorma: 'NCh 461 / ANSI Z89.1',
      cantidad: 1,
      estado: 'nuevo'
    },
    calzado: {
      nombre: 'Calzado de Seguridad Dieléctrico Puntera Composite',
      tipo: 'pies',
      marca: 'Norseg / Bata Industrials',
      modeloTalla: 'Titanium Talla 42',
      certificacionNorma: 'NCh 772/1 Of.92',
      cantidad: 1,
      estado: 'nuevo'
    },
    antiparras: {
      nombre: 'Antiparras de Seguridad Policarbonato Antiempaño UV',
      tipo: 'ojos_rostro',
      marca: '3M',
      modeloTalla: 'Virtua CCS Claro',
      certificacionNorma: 'ANSI Z87.1 / NCh 1301',
      cantidad: 1,
      estado: 'nuevo'
    },
    guantes: {
      nombre: 'Guantes de Cabritilla Reforzada para Construcción',
      tipo: 'manos',
      marca: 'Steelpro',
      modeloTalla: 'Talla 9 (L)',
      certificacionNorma: 'EN 388 / NCh 1115',
      cantidad: 2,
      estado: 'nuevo'
    },
    chaleco: {
      nombre: 'Chaleco Geólogo Reflectante Alta Visibilidad Clase 2',
      tipo: 'ropa',
      marca: 'Yoko / Minseg',
      modeloTalla: 'Talla XL',
      certificacionNorma: 'NCh 3253 / EN ISO 20471',
      cantidad: 1,
      estado: 'nuevo'
    },
    auditivo: {
      nombre: 'Protector Auditivo Tipo Fono Atenuación 27dB',
      tipo: 'auditivo',
      marca: 'Howard Leight / 3M',
      modeloTalla: 'Leightning L1H',
      certificacionNorma: 'NCh 1331 / ANSI S3.19',
      cantidad: 1,
      estado: 'nuevo'
    },
    respirador: {
      nombre: 'Respirador Medio Rostro Silicona con Filtros P100 Polvo/Sílice',
      tipo: 'respiratorio',
      marca: '3M',
      modeloTalla: 'Serie 7502 (M)',
      certificacionNorma: 'NIOSH P100 / NCh 1258',
      cantidad: 1,
      estado: 'nuevo'
    }
  };

  const handleCreateDelivery = async () => {
    const worker = workers.find(w => w.id === selectedWorkerId);
    if (!worker) {
      alert('Seleccione un trabajador receptor.');
      return;
    }

    const itemsToDeliver: EppItem[] = [];
    Object.keys(selectedItems).forEach(key => {
      if (selectedItems[key]) {
        itemsToDeliver.push(availableEppCatalog[key]);
      }
    });

    if (itemsToDeliver.length === 0) {
      alert('Seleccione al menos un elemento de protección para entregar.');
      return;
    }

    const deliveryId = `epp-${Date.now().toString().slice(-6)}`;
    const today = new Date().toISOString().slice(0, 10);

    const newDelivery: EppDelivery = {
      id: deliveryId,
      tenantId: tenant.id,
      workerId: worker.id,
      workerNombre: `${worker.nombres} ${worker.apellidos}`,
      workerRut: worker.rut,
      workerCargo: worker.cargo,
      faenaUbicacion: faena.trim() || worker.faenaUbicacion,
      supervisorResponsable: supervisorName.trim(),
      fechaEntrega: today,
      estadoFirma: 'pendiente',
      observacionesNormativas: 'Entrega conforme a matriz de riesgos del puesto y D.S. 594 Art. 68. Capacitación teórica y práctica impartida al trabajador.',
      items: itemsToDeliver,
    };

    // Crear documento formal asociado
    const docId = `doc-epp-${deliveryId}`;
    const textContent = `REGISTRO OFICIAL DE ENTREGA DE ELEMENTOS DE PROTECCIÓN PERSONAL (EPP)
(Conforme al Artículo 68 del D.S. N° 594 y Ley N° 16.744 sobre Accidentes del Trabajo)

EMPRESA: ${tenant.razonSocial} (RUT ${tenant.rut})
SUPERVISOR RESPONSABLE: ${supervisorName}
TRABAJADOR RECEPTOR: ${worker.nombres} ${worker.apellidos} (RUT ${worker.rut})
CARGO: ${worker.cargo} | FAENA: ${faena}
FECHA: ${today}

ELEMENTOS ENTREGADOS A ENTERA CONFORMIDAD:
${itemsToDeliver.map((it, idx) => `${idx + 1}. ${it.nombre} - Marca: ${it.marca} (${it.certificacionNorma}) - Cantidad: ${it.cantidad}`).join('\n')}

COMPROMISO DE SEGURIDAD DEL TRABAJADOR:
1. Declaro haber recibido de forma gratuita y en perfecto estado los EPP señalados.
2. He sido debidamente capacitado en su uso, mantención y almacenamiento según las instrucciones del fabricante.
3. Asumo la obligación legal de utilizarlos en forma permanente en toda área que revista riesgos de accidentes o enfermedades profesionales.`;

    const hash = await calculateSha256(textContent);

    const eppDoc: Document = {
      id: docId,
      tenantId: tenant.id,
      titulo: `Comprobante Entrega EPP D.S. 594 - ${worker.nombres} ${worker.apellidos}`,
      categoria: 'epp',
      tipoFirmaRequerida: 'simple',
      estado: 'pendiente',
      version: 1,
      hashSha256: hash,
      descripcion: `Entrega de ${itemsToDeliver.length} elementos de protección según D.S. 594`,
      contenidoTexto: textContent,
      tamanoBytes: 92000,
      nombreArchivo: `Acta_EPP_${worker.rut.replace(/[^0-9kK]/g, '')}.pdf`,
      creadoPorUsuarioId: 'u-prevencion',
      creadoPorNombre: supervisorName,
      trabajadorDestinatarioId: worker.id,
      trabajadorNombre: `${worker.nombres} ${worker.apellidos}`,
      trabajadorRut: worker.rut,
      firmantes: [
        {
          id: `sig-${docId}-1`,
          workerId: worker.id,
          rut: worker.rut,
          nombreCompleto: `${worker.nombres} ${worker.apellidos}`,
          email: worker.email,
          cargo: worker.cargo,
          ordenFirma: 1,
          estado: 'pendiente',
          tipoFirma: 'simple',
        }
      ],
      fechaCreacion: new Date().toISOString(),
      fechaVencimiento: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    };

    newDelivery.documentoId = docId;
    storage.addEppDelivery(newDelivery);
    storage.addDocument(eppDoc);
    onDocumentCreated(eppDoc);

    setShowCreateModal(false);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Entrega de Elementos de Protección Personal (EPP)
          </h2>
          <p className="text-xs text-slate-400">
            Cumplimiento legal D.S. 594 Art. 68 y Ley 16.744. Registro auditable de entrega y capacitación.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Entrega de EPP</span>
        </button>
      </div>

      {/* Nota preventiva obligatoria del prompt */}
      <div className="p-3.5 rounded-xl bg-[#0e2942]/70 border border-[#1b436c] text-xs text-slate-300 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-white block">Aviso de Cumplimiento Preventivo Laboral:</strong>
          <span className="text-[11px] text-slate-300">
            La firma electrónica del comprobante de entrega de EPP acredita la recepción material y capacitación del trabajador, pero <strong>no sustituye</strong> las demás obligaciones del empleador en materia de higiene, seguridad y matrices de prevención de riesgos dispuestas por la Ley N° 16.744 y los organismos administradores (Mutual de Seguridad, ACHS, IST).
          </span>
        </div>
      </div>

      {/* Lista de Entregas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {deliveries.map((del) => {
          const isSigned = del.estadoFirma === 'firmado';
          return (
            <div
              key={del.id}
              className="p-4 rounded-xl bg-[#0c1e30] border border-[#1b3b5c] shadow-sm space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <HardHat className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-white">
                        {del.workerNombre}
                      </h4>
                      <p className="text-[10px] font-mono text-cyan-300">
                        RUT: {del.workerRut} • {del.workerCargo}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    isSigned
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {del.estadoFirma}
                  </span>
                </div>

                <div className="mt-3 text-xs text-slate-300 space-y-1">
                  <p><span className="text-slate-400">Supervisor:</span> {del.supervisorResponsable}</p>
                  <p><span className="text-slate-400">Faena / Obra:</span> {del.faenaUbicacion}</p>
                  <p><span className="text-slate-400">Fecha de Entrega:</span> {del.fechaEntrega}</p>
                </div>

                {/* Lista de ítems entregados */}
                <div className="mt-3 pt-2.5 border-t border-[#163350]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Elementos Asignados ({del.items.length}):
                  </span>
                  <div className="space-y-1">
                    {del.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-[11px] bg-[#081522] px-2 py-1 rounded">
                        <span className="text-slate-200 truncate max-w-[200px]">{it.nombre}</span>
                        <span className="text-cyan-300 font-mono font-medium">{it.certificacionNorma}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#183654] flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  D.S. 594 Verificado
                </span>
                <button
                  onClick={() => generateEppReceiptPdf(del)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0e3b60] hover:bg-[#124b7a] text-cyan-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Acta PDF</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Nueva Entrega */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0b1c2e] border border-[#1e3c5c] rounded-xl w-full max-w-lg p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-sm text-white">
              Nueva Entrega de EPP (D.S. 594 / Ley 16.744)
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Trabajador Receptor:</label>
                <select
                  aria-label="Seleccionar trabajador receptor para EPP"
                  value={selectedWorkerId}
                  onChange={(e) => setSelectedWorkerId(e.target.value)}
                  className="w-full bg-[#081522] border border-[#193552] rounded p-2 text-white"
                >
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.nombres} {w.apellidos} — RUT: {w.rut} ({w.cargo})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Supervisor / Prevencionista:</label>
                  <input
                    type="text"
                    value={supervisorName}
                    onChange={(e) => setSupervisorName(e.target.value)}
                    className="w-full bg-[#081522] border border-[#193552] rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Faena u Obra:</label>
                  <input
                    type="text"
                    value={faena}
                    onChange={(e) => setFaena(e.target.value)}
                    className="w-full bg-[#081522] border border-[#193552] rounded p-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-2 font-bold">
                  Seleccione los Elementos a Entregar:
                </label>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {Object.entries(availableEppCatalog).map(([key, item]) => (
                    <label
                      key={key}
                      className="flex items-start gap-2.5 p-2 rounded bg-[#081522] border border-[#15304b] cursor-pointer hover:bg-[#0c2034]"
                    >
                      <input
                        type="checkbox"
                        checked={selectedItems[key] || false}
                        onChange={(e) => setSelectedItems(prev => ({ ...prev, [key]: e.target.checked }))}
                        className="mt-1 h-3.5 w-3.5 rounded text-emerald-500 bg-[#07131f] border-slate-600"
                      />
                      <div className="text-[11px]">
                        <p className="font-semibold text-white">{item.nombre}</p>
                        <p className="text-slate-400 text-[10px]">
                          Norma: <span className="text-cyan-300">{item.certificacionNorma}</span> • Marca: {item.marca}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreateDelivery}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow"
                >
                  Generar Acta y Enviar a Firma
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
