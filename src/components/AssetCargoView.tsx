import React, { useState } from 'react';
import { 
  Wrench, 
  Plus, 
  Search, 
  FileCheck, 
  User, 
  RotateCcw, 
  Download, 
  CheckCircle2, 
  Clock, 
  Tag, 
  FileText 
} from 'lucide-react';
import { Tenant, AssetTool, Worker, Document } from '../types';
import { storage } from '../services/mockStorage';
import { generateSignedDocumentPdf } from '../utils/pdfGenerator';
import { calculateSha256 } from '../utils/crypto';

interface AssetCargoViewProps {
  tenant: Tenant;
  assets: AssetTool[];
  workers: Worker[];
  onDocumentCreated: (doc: Document) => void;
  onOpenSignDocument: (doc: Document) => void;
}

export const AssetCargoView: React.FC<AssetCargoViewProps> = ({
  tenant,
  assets,
  workers,
  onDocumentCreated,
  onOpenSignDocument,
}) => {
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAssetForAssign, setSelectedAssetForAssign] = useState<AssetTool | null>(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>(workers[0]?.id || '');
  const [assignmentObservation, setAssignmentObservation] = useState('');

  // Form new asset
  const [newCodigo, setNewCodigo] = useState('');
  const [newNombre, setNewNombre] = useState('');
  const [newMarca, setNewMarca] = useState('');
  const [newModelo, setNewModelo] = useState('');
  const [newSerie, setNewSerie] = useState('');
  const [newValor, setNewValor] = useState(150000);

  const handleCreateAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNombre.trim() || !newCodigo.trim()) {
      alert('Complete los campos obligatorios.');
      return;
    }

    const newAsset: AssetTool = {
      id: `ast-${Date.now()}`,
      tenantId: tenant.id,
      codigoInventario: newCodigo.trim().toUpperCase(),
      nombre: newNombre.trim(),
      marca: newMarca.trim() || 'Genérica',
      modelo: newModelo.trim(),
      numeroSerie: newSerie.trim() || 'S/N',
      estado: 'operativo',
      valorEstimadoClp: Number(newValor),
      observaciones: 'Ingresado al pañol central',
    };

    storage.addAsset(newAsset);
    setShowAddAssetModal(false);
    // Limpiar campos
    setNewCodigo('');
    setNewNombre('');
    setNewMarca('');
    setNewModelo('');
    setNewSerie('');
  };

  const handleConfirmAssignment = async () => {
    if (!selectedAssetForAssign) return;
    const worker = workers.find(w => w.id === selectedWorkerId);
    if (!worker) {
      alert('Seleccione un trabajador.');
      return;
    }

    const docId = `doc-cargo-${Date.now().toString().slice(-6)}`;
    const textContent = `ACTA DE ENTREGA EN CUSTODIA Y HOJA DE CARGO DE HERRAMIENTAS

EMPRESA: ${tenant.razonSocial} (RUT: ${tenant.rut})
TRABAJADOR RECEPTOR: ${worker.nombres} ${worker.apellidos} (RUT: ${worker.rut})
CARGO: ${worker.cargo} | FAENA: ${worker.faenaUbicacion}
FECHA: ${new Date().toLocaleDateString('es-CL')}

Por el presente acto, el empleador hace entrega en custodia al trabajador de la siguiente herramienta de trabajo para el desempeño exclusivo de sus funciones laborales:

- EQUIPO / HERRAMIENTA: ${selectedAssetForAssign.nombre}
- CÓDIGO INTERNO DE INVENTARIO: ${selectedAssetForAssign.codigoInventario}
- MARCA: ${selectedAssetForAssign.marca}
- MODELO: ${selectedAssetForAssign.modelo}
- NÚMERO DE SERIE: ${selectedAssetForAssign.numeroSerie}
- VALOR ESTIMADO DE REPOSICIÓN: $${selectedAssetForAssign.valorEstimadoClp.toLocaleString('es-CL')} CLP
- ESTADO DE ENTREGA: BUEN ESTADO OPERATIVO

OBLIGACIONES Y COMPROMISO DEL TRABAJADOR:
1. El trabajador asume la custodia, conservación y cuidado directo de la herramienta individualizada.
2. Queda estrictamente prohibido utilizar dicha herramienta para fines particulares ajenos a la empresa o prestarla a terceros no autorizados.
3. El trabajador se obliga a reintegrar la herramienta al pañol de obra al término de la faena, desvinculación o cuando el empleador lo requiera.
4. En caso de desperfecto mecánico atribuible al desgaste natural, dará aviso inmediato a su jefatura para la mantención o recambio correspondiente.

Suscrito mediante Firma Electrónica Simple bajo el tenor del Art. 3° de la Ley N° 19.799.`;

    const hash = await calculateSha256(textContent);

    const cargoDoc: Document = {
      id: docId,
      tenantId: tenant.id,
      titulo: `Hoja de Cargo Herramienta ${selectedAssetForAssign.codigoInventario} - ${worker.nombres} ${worker.apellidos}`,
      categoria: 'hoja_cargo',
      tipoFirmaRequerida: 'simple',
      estado: 'pendiente',
      version: 1,
      hashSha256: hash,
      descripcion: `Asignación de herramienta ${selectedAssetForAssign.nombre} a ${worker.nombres} ${worker.apellidos}`,
      contenidoTexto: textContent,
      tamanoBytes: 95000,
      nombreArchivo: `Hoja_Cargo_${selectedAssetForAssign.codigoInventario}.pdf`,
      creadoPorUsuarioId: 'u-admin-1',
      creadoPorNombre: 'Encargado de Pañol',
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
      fechaVencimiento: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString(),
    };

    // Actualizar estado del activo
    selectedAssetForAssign.estado = 'asignado';
    selectedAssetForAssign.observaciones = `Asignada a ${worker.nombres} ${worker.apellidos} (Doc ${docId})`;
    storage.updateDocument(cargoDoc);
    onDocumentCreated(cargoDoc);

    setShowAssignModal(false);
    setSelectedAssetForAssign(null);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Hojas de Cargo de Herramientas y Equipos
          </h2>
          <p className="text-xs text-slate-400">
            Control de custodia, números de serie, asignaciones individuales y actas electrónicas firmadas.
          </p>
        </div>
        <button
          onClick={() => setShowAddAssetModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Herramienta</span>
        </button>
      </div>

      {/* Asset Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {assets.map((asset) => {
          const isAssigned = asset.estado === 'asignado';
          return (
            <div
              key={asset.id}
              className="p-4 rounded-xl bg-[#0c1e30] border border-[#1b3b5c] shadow-sm flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-mono text-[10px] text-cyan-300 font-bold block">
                        {asset.codigoInventario}
                      </span>
                      <h4 className="font-bold text-xs text-white">
                        {asset.nombre}
                      </h4>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    isAssigned
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {asset.estado}
                  </span>
                </div>

                <div className="mt-3 space-y-1 text-xs text-slate-300">
                  <p><span className="text-slate-400">Marca / Modelo:</span> {asset.marca} {asset.modelo}</p>
                  <p><span className="text-slate-400">N° Serie:</span> <code className="font-mono text-cyan-300">{asset.numeroSerie}</code></p>
                  <p><span className="text-slate-400">Valor de Reposición:</span> ${asset.valorEstimadoClp.toLocaleString('es-CL')} CLP</p>
                  {asset.observaciones && (
                    <p className="text-[11px] text-slate-400 italic pt-1 border-t border-[#163350]">
                      {asset.observaciones}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-[#183654] flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  {isAssigned ? 'En custodia activa' : 'Disponible en pañol'}
                </span>

                {!isAssigned ? (
                  <button
                    onClick={() => {
                      setSelectedAssetForAssign(asset);
                      setShowAssignModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0e3b60] hover:bg-[#124b7a] text-cyan-200 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Asignar y Generar Acta</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Con Hoja de Cargo</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Registrar Herramienta */}
      {showAddAssetModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0b1c2e] border border-[#1e3c5c] rounded-xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <h3 className="font-bold text-sm text-white">
              Registrar Nueva Herramienta en Pañol
            </h3>
            <form onSubmit={handleCreateAsset} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Código de Inventario (ej: HRR-AND-04):</label>
                <input
                  type="text"
                  required
                  value={newCodigo}
                  onChange={(e) => setNewCodigo(e.target.value)}
                  placeholder="HRR-AND-..."
                  className="w-full bg-[#081522] border border-[#193552] rounded p-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Nombre del Equipo / Herramienta:</label>
                <input
                  type="text"
                  required
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                  placeholder="Ej: Esmeril Angular 4-1/2 840W"
                  className="w-full bg-[#081522] border border-[#193552] rounded p-2 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Marca:</label>
                  <input
                    type="text"
                    value={newMarca}
                    onChange={(e) => setNewMarca(e.target.value)}
                    placeholder="Makita / Bosch"
                    className="w-full bg-[#081522] border border-[#193552] rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Modelo:</label>
                  <input
                    type="text"
                    value={newModelo}
                    onChange={(e) => setNewModelo(e.target.value)}
                    placeholder="GA4530"
                    className="w-full bg-[#081522] border border-[#193552] rounded p-2 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Número de Serie:</label>
                  <input
                    type="text"
                    value={newSerie}
                    onChange={(e) => setNewSerie(e.target.value)}
                    placeholder="SN-..."
                    className="w-full bg-[#081522] border border-[#193552] rounded p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Valor Reposición (CLP):</label>
                  <input
                    type="number"
                    value={newValor}
                    onChange={(e) => setNewValor(Number(e.target.value))}
                    className="w-full bg-[#081522] border border-[#193552] rounded p-2 text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddAssetModal(false)}
                  className="px-3.5 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow"
                >
                  Guardar Herramienta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Asignar Herramienta */}
      {showAssignModal && selectedAssetForAssign && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0b1c2e] border border-[#1e3c5c] rounded-xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <h3 className="font-bold text-sm text-white">
              Asignar {selectedAssetForAssign.nombre}
            </h3>
            <p className="text-xs text-slate-400">
              Se generará automáticamente una Hoja de Cargo electrónica con cláusula de custodia y solicitud de firma al trabajador.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Trabajador Receptor:</label>
                <select
                  aria-label="Seleccionar trabajador receptor"
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

              <div className="p-2.5 rounded bg-[#091726] border border-[#163350] text-[11px] text-slate-300">
                <span className="font-bold text-amber-400 block mb-0.5">Custodia Legal:</span>
                El trabajador recibirá un enlace con el comprobante para firmar electrónicamente según Ley 19.799.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-3.5 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAssignment}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow"
                >
                  Generar y Enviar a Firma
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
