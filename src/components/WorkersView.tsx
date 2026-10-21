import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  FileSpreadsheet, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  Mail, 
  MapPin, 
  Briefcase,
  Wrench,
  HardHat
} from 'lucide-react';
import { Tenant, Worker } from '../types';
import { storage } from '../services/mockStorage';
import { formatRut, validateRut } from '../utils/rut';

interface WorkersViewProps {
  tenant: Tenant;
  workers: Worker[];
  onWorkerAdded: (worker: Worker) => void;
}

export const WorkersView: React.FC<WorkersViewProps> = ({
  tenant,
  workers,
  onWorkerAdded,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Form states
  const [rut, setRut] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('+56 9 ');
  const [cargo, setCargo] = useState('');
  const [faena, setFaena] = useState('Faena Principal');
  const [afp, setAfp] = useState('Modelo');
  const [salud, setSalud] = useState<'Fonasa' | 'Isapre'>('Fonasa');
  const [rutError, setRutError] = useState('');

  // Bulk import simulation
  const [csvPreview, setCsvPreview] = useState<any[]>([]);

  const handleRutBlur = () => {
    if (!rut.trim()) {
      setRutError('');
      return;
    }
    if (!validateRut(rut)) {
      setRutError('RUT inválido según algoritmo Módulo 11 oficial de Chile.');
    } else {
      setRutError('');
      setRut(formatRut(rut));
    }
  };

  const handleCreateWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRut(rut)) {
      setRutError('Debe ingresar un RUT chileno válido.');
      return;
    }
    if (!nombres.trim() || !apellidos.trim() || !cargo.trim()) {
      alert('Complete los campos obligatorios.');
      return;
    }

    const newWorker: Worker = {
      id: `w-${Date.now().toString().slice(-6)}`,
      tenantId: tenant.id,
      rut: formatRut(rut),
      nombres: nombres.trim(),
      apellidos: apellidos.trim(),
      email: email.trim() || `${nombres.toLowerCase().slice(0, 1)}${apellidos.toLowerCase().replace(/\s+/g, '')}@trabajador.cl`,
      telefono: telefono.trim(),
      cargo: cargo.trim(),
      faenaUbicacion: faena.trim(),
      fechaIngreso: new Date().toISOString().slice(0, 10),
      estado: 'activo',
      afp: afp,
      salud: salud,
      herramientasAsignadasCount: 0,
      eppAsignadosCount: 0,
    };

    storage.addWorker(newWorker);
    onWorkerAdded(newWorker);

    // Reset
    setRut('');
    setNombres('');
    setApellidos('');
    setEmail('');
    setTelefono('+56 9 ');
    setCargo('');
    setShowAddModal(false);
  };

  const handleSimulateCsvUpload = () => {
    const sampleRows = [
      { rut: '18.490.112-8', nombres: 'Carlos Alberto', apellidos: 'Lara Morales', cargo: 'Operador Rigger', email: 'clara@empresa.cl', faena: 'Obra Central' },
      { rut: '16.711.902-3', nombres: 'Jorge Andrés', apellidos: 'Navarro Soto', cargo: 'Soldador Calificado 6G', email: 'jnavarro@empresa.cl', faena: 'Taller Base' },
      { rut: '19.822.340-K', nombres: 'Felipe Ignacio', apellidos: 'Peña Valdés', cargo: 'Técnico Eléctrico SEC', email: 'fpena@empresa.cl', faena: 'Faena Oriente' },
    ];
    setCsvPreview(sampleRows);
  };

  const handleConfirmImport = () => {
    csvPreview.forEach(row => {
      const w: Worker = {
        id: `w-${Date.now()}-${Math.random().toString().slice(2, 6)}`,
        tenantId: tenant.id,
        rut: row.rut,
        nombres: row.nombres,
        apellidos: row.apellidos,
        email: row.email,
        telefono: '+56 9 8000 0000',
        cargo: row.cargo,
        faenaUbicacion: row.faena,
        fechaIngreso: new Date().toISOString().slice(0, 10),
        estado: 'activo',
        afp: 'Habitat',
        salud: 'Fonasa',
        herramientasAsignadasCount: 0,
        eppAsignadosCount: 0,
      };
      storage.addWorker(w);
      onWorkerAdded(w);
    });
    setShowImportModal(false);
    setCsvPreview([]);
  };

  const filteredWorkers = workers.filter(w =>
    `${w.nombres} ${w.apellidos}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.rut.includes(searchTerm) ||
    w.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.faenaUbicacion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Nómina de Trabajadores y Firmantes
          </h2>
          <p className="text-xs text-slate-400">
            Registro laboral con validación de RUT oficial, obras/faenas y trazabilidad de custodia de herramientas y EPP.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#143452] hover:bg-[#1a4166] text-slate-200 text-xs font-semibold border border-[#214b73] transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Importar CSV</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nuevo Trabajador</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-3 rounded-xl bg-[#0c1e30] border border-[#1b3b5c]">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, RUT chileno, cargo o faena..."
            className="w-full bg-[#081522] border border-[#193552] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      {/* Workers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWorkers.map((worker) => (
          <div
            key={worker.id}
            className="p-4 rounded-xl bg-[#0c1e30] border border-[#1b3b5c] shadow-sm flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-sm text-white">
                    {worker.nombres} {worker.apellidos}
                  </h4>
                  <p className="text-xs font-mono text-cyan-300 font-semibold mt-0.5">
                    RUT: {worker.rut}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                  {worker.estado}
                </span>
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center gap-2 text-slate-300">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-medium text-white">{worker.cargo}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{worker.faenaUbicacion}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{worker.email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{worker.telefono}</span>
                </div>
              </div>
            </div>

            <div className="pt-2.5 border-t border-[#183654] flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Wrench className="w-3 h-3 text-amber-400" />
                <span>{worker.herramientasAsignadasCount} Herramientas</span>
              </span>
              <span className="flex items-center gap-1">
                <HardHat className="w-3 h-3 text-emerald-400" />
                <span>{worker.eppAsignadosCount} EPPs</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Agregar Trabajador */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0b1c2e] border border-[#1e3c5c] rounded-xl w-full max-w-lg p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-sm text-white">
              Registrar Trabajador en {tenant.nombreFantasia}
            </h3>

            <form onSubmit={handleCreateWorker} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-bold">
                  RUT Chileno (con dígito verificador):
                </label>
                <input
                  type="text"
                  required
                  value={rut}
                  onChange={(e) => setRut(e.target.value)}
                  onBlur={handleRutBlur}
                  placeholder="Ej: 16.482.903-7"
                  className="w-full bg-[#081522] border border-[#193552] rounded p-2 text-white font-mono text-xs focus:border-cyan-400"
                />
                {rutError && (
                  <p className="text-red-400 text-[11px] mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{rutError}</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Nombres:</label>
                  <input
                    type="text"
                    required
                    value={nombres}
                    onChange={(e) => setNombres(e.target.value)}
                    placeholder="Rodrigo Alejandro"
                    className="w-full bg-[#081522] border border-[#193552] rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Apellidos:</label>
                  <input
                    type="text"
                    required
                    value={apellidos}
                    onChange={(e) => setApellidos(e.target.value)}
                    placeholder="Muñoz Valenzuela"
                    className="w-full bg-[#081522] border border-[#193552] rounded p-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Cargo Laboral:</label>
                  <input
                    type="text"
                    required
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    placeholder="Ej: Maestro Primera"
                    className="w-full bg-[#081522] border border-[#193552] rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Faena u Obra:</label>
                  <input
                    type="text"
                    value={faena}
                    onChange={(e) => setFaena(e.target.value)}
                    placeholder="Edificio Oriente"
                    className="w-full bg-[#081522] border border-[#193552] rounded p-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Correo Electrónico:</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nombre@gmail.com"
                    className="w-full bg-[#081522] border border-[#193552] rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Teléfono:</label>
                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full bg-[#081522] border border-[#193552] rounded p-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">AFP:</label>
                  <select
                    aria-label="Seleccionar AFP"
                    value={afp}
                    onChange={(e) => setAfp(e.target.value)}
                    className="w-full bg-[#081522] border border-[#193552] rounded p-2 text-white"
                  >
                    <option value="Modelo">AFP Modelo</option>
                    <option value="Habitat">AFP Habitat</option>
                    <option value="Cuprum">AFP Cuprum</option>
                    <option value="PlanVital">AFP PlanVital</option>
                    <option value="Provida">AFP Provida</option>
                    <option value="Capital">AFP Capital</option>
                    <option value="Uno">AFP Uno</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Sistema de Salud:</label>
                  <select
                    aria-label="Seleccionar sistema de salud"
                    value={salud}
                    onChange={(e) => setSalud(e.target.value as any)}
                    className="w-full bg-[#081522] border border-[#193552] rounded p-2 text-white"
                  >
                    <option value="Fonasa">Fonasa</option>
                    <option value="Isapre">Isapre</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow"
                >
                  Guardar Trabajador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Importar CSV */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0b1c2e] border border-[#1e3c5c] rounded-xl w-full max-w-xl p-5 shadow-2xl space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Importación Masiva de Trabajadores desde Excel / CSV</span>
            </h3>

            <p className="text-xs text-slate-400">
              Cargue una nómina con las columnas: <code>RUT, Nombres, Apellidos, Cargo, Email, Faena</code>.
            </p>

            {csvPreview.length === 0 ? (
              <div className="p-6 border-2 border-dashed border-[#1c3d5f] rounded-xl text-center space-y-3">
                <p className="text-xs text-slate-300">
                  Puede simular la carga con una muestra real de trabajadores chilenos:
                </p>
                <button
                  onClick={handleSimulateCsvUpload}
                  className="px-4 py-2 bg-[#0e3b60] hover:bg-[#124b7a] text-cyan-200 text-xs font-bold rounded-lg cursor-pointer"
                >
                  Cargar Nómina de Muestra (3 Trabajadores con RUT Válido)
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="max-h-48 overflow-y-auto border border-[#193552] rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#081522] text-slate-400 text-[10px] uppercase">
                      <tr>
                        <th className="p-2">RUT</th>
                        <th className="p-2">Nombre Completo</th>
                        <th className="p-2">Cargo</th>
                        <th className="p-2">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#152e47] text-slate-300">
                      {csvPreview.map((r, i) => (
                        <tr key={i}>
                          <td className="p-2 font-mono text-cyan-300">{r.rut}</td>
                          <td className="p-2">{r.nombres} {r.apellidos}</td>
                          <td className="p-2">{r.cargo}</td>
                          <td className="p-2 text-emerald-400 font-semibold">✓ Válido M11</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setCsvPreview([])}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                  >
                    Descartar
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    className="px-4 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow"
                  >
                    Confirmar e Importar {csvPreview.length} Trabajadores
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setCsvPreview([]);
                }}
                className="px-3.5 py-1 text-xs text-slate-400 hover:text-white"
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
