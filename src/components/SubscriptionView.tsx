import React, { useState } from 'react';
import { 
  CreditCard, 
  Check, 
  Sparkles, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  Layers, 
  HardDrive, 
  FileText, 
  Users 
} from 'lucide-react';
import { Tenant } from '../types';
import { INITIAL_PLANS, storage } from '../services/mockStorage';

interface SubscriptionViewProps {
  tenant: Tenant;
  onTenantUpdated: (updated: Tenant) => void;
}

export const SubscriptionView: React.FC<SubscriptionViewProps> = ({
  tenant,
  onTenantUpdated,
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState(tenant.planId);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [gatewaySelected, setGatewaySelected] = useState<'webpay' | 'fintoc'>('webpay');
  const [isProcessing, setIsProcessing] = useState(false);

  const docPercent = Math.min(100, Math.round((tenant.documentosConsumidosMes / tenant.limiteDocumentosMes) * 100));
  const storagePercent = Math.min(100, Math.round((tenant.almacenamientoUsadoMb / tenant.limiteAlmacenamientoMb) * 100));

  const handleSelectPlan = (planId: 'inicial' | 'empresa' | 'profesional') => {
    setSelectedPlanId(planId);
    setShowPaymentModal(true);
  };

  const handleConfirmPlanChange = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const plan = INITIAL_PLANS.find(p => p.id === selectedPlanId);
      if (plan) {
        const updated: Tenant = {
          ...tenant,
          planId: plan.id,
          limiteDocumentosMes: plan.limiteDocumentosMes,
          limiteAlmacenamientoMb: plan.limiteAlmacenamientoMb,
          limiteUsuarios: plan.limiteUsuarios,
        };
        storage.updateTenant(updated);
        onTenantUpdated(updated);
      }
      setIsProcessing(false);
      setShowPaymentModal(false);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight">
          Suscripción y Consumo de Recursos SaaS
        </h2>
        <p className="text-xs text-slate-400">
          Facturación en pesos chilenos (CLP) con boleta o factura electrónica y pasarela bancaria nacional.
        </p>
      </div>

      {/* Monitor de consumo actual */}
      <div className="p-5 rounded-2xl bg-[#0c1e30] border border-[#1b3b5c] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#183654]">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Plan Vigente
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <h3 className="text-base font-extrabold text-white">
                Plan {tenant.planId.toUpperCase()}
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ACTIVO
              </span>
            </div>
          </div>
          <div className="text-xs text-slate-300 sm:text-right">
            <span>Ciclo de facturación mensual: </span>
            <strong className="text-white">Renueva el 01 del próximo mes</strong>
          </div>
        </div>

        {/* Gauges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-xl bg-[#081522] border border-[#163350]">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                Documentos emitidos:
              </span>
              <span className="font-mono font-bold text-white">
                {tenant.documentosConsumidosMes} / {tenant.limiteDocumentosMes}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#132c45] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  docPercent > 80 ? 'bg-amber-400' : 'bg-emerald-500'
                }`}
                style={{ width: `${docPercent}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5 flex justify-between">
              <span>{tenant.limiteDocumentosMes - tenant.documentosConsumidosMes} disponibles</span>
              <span className="font-semibold text-cyan-400">{docPercent}%</span>
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#081522] border border-[#163350]">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-400 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                Almacenamiento S3:
              </span>
              <span className="font-mono font-bold text-white">
                {tenant.almacenamientoUsadoMb} MB / {tenant.limiteAlmacenamientoMb} MB
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#132c45] overflow-hidden">
              <div
                className="h-full rounded-full bg-cyan-500 transition-all"
                style={{ width: `${storagePercent}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5 flex justify-between">
              <span>Cifrado en reposo AES-256</span>
              <span className="font-semibold text-cyan-400">{storagePercent}%</span>
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#081522] border border-[#163350]">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                Usuarios de la empresa:
              </span>
              <span className="font-mono font-bold text-white">
                3 / {tenant.limiteUsuarios}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#132c45] overflow-hidden">
              <div
                className="h-full rounded-full bg-purple-500 transition-all"
                style={{ width: `${Math.round((3 / tenant.limiteUsuarios) * 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">
              Supervisores y administradores
            </p>
          </div>
        </div>
      </div>

      {/* Grid de los 3 planes SaaS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {INITIAL_PLANS.map((plan) => {
          const isCurrent = tenant.planId === plan.id;
          const isEmpresa = plan.id === 'empresa';

          return (
            <div
              key={plan.id}
              className={`p-5 rounded-2xl flex flex-col justify-between transition-all relative ${
                isEmpresa
                  ? 'bg-gradient-to-b from-[#0f2e4a] to-[#0c1f32] border-2 border-emerald-500/70 shadow-lg'
                  : 'bg-[#0c1e30] border border-[#1b3b5c]'
              }`}
            >
              {isEmpresa && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-500 text-white font-black text-[10px] tracking-wider uppercase shadow">
                  MÁS RECOMENDADO CHILE
                </div>
              )}

              <div>
                <h3 className="text-base font-extrabold text-white">
                  {plan.nombre}
                </h3>
                <p className="text-xs text-slate-300 mt-1 min-h-[36px]">
                  {plan.descripcion}
                </p>

                <div className="my-4">
                  <span className="text-2xl font-black text-white font-mono">
                    ${plan.precioMensualClp.toLocaleString('es-CL')}
                  </span>
                  <span className="text-xs text-slate-400"> CLP / mes + IVA</span>
                </div>

                <div className="space-y-2.5 text-xs text-slate-200 border-t border-[#183654] pt-4">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>{plan.limiteDocumentosMes}</strong> documentos mensuales</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>{plan.limiteUsuarios}</strong> usuarios de administración</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>{plan.limiteAlmacenamientoMb / 1000} GB</strong> almacenamiento privado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Hojas de Cargo y Entrega de EPP</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{plan.soporte}</span>
                  </div>
                  {plan.incluyeApiRest && (
                    <div className="flex items-center gap-2 text-cyan-300">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>API REST y Webhooks para ERP</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-6">
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-xl bg-[#14324f] text-slate-400 font-bold text-xs border border-[#1d446b] cursor-default"
                  >
                    Plan Activo Actualmente
                  </button>
                ) : (
                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow cursor-pointer"
                  >
                    Cambiar a {plan.nombre}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Pasarela de Pago */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0b1c2e] border border-[#1e3c5c] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-sm text-white">
              Confirmar Suscripción - {INITIAL_PLANS.find(p => p.id === selectedPlanId)?.nombre}
            </h3>
            <p className="text-xs text-slate-300">
              Integración con pasarelas de pago recurrentes para Chile (Webpay Plus y Fintoc).
            </p>

            <div className="space-y-2 text-xs">
              <label className="block text-slate-400 font-bold">Seleccione medio de pago:</label>
              <div
                onClick={() => setGatewaySelected('webpay')}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer ${
                  gatewaySelected === 'webpay' ? 'bg-[#0f2e4c] border-emerald-500' : 'bg-[#081522] border-[#183654]'
                }`}
              >
                <div>
                  <span className="font-bold text-white block">Transbank Webpay Plus</span>
                  <span className="text-[10px] text-slate-400">Tarjetas de Crédito, Débito Redcompra y Prepago</span>
                </div>
                <CreditCard className="w-4 h-4 text-cyan-400" />
              </div>

              <div
                onClick={() => setGatewaySelected('fintoc')}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer ${
                  gatewaySelected === 'fintoc' ? 'bg-[#0f2e4c] border-emerald-500' : 'bg-[#081522] border-[#183654]'
                }`}
              >
                <div>
                  <span className="font-bold text-white block">Fintoc (Transferencia Bancaria Directa)</span>
                  <span className="text-[10px] text-slate-400">Banco de Chile, Santander, BCI, BancoEstado</span>
                </div>
                <CreditCard className="w-4 h-4 text-emerald-400" />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#07131f] border border-[#15324d] text-[11px] text-slate-400">
              <strong className="text-slate-300 block mb-0.5">Política de Seguridad Financiera:</strong>
              No almacenamos números de tarjeta en nuestros servidores. La transacción se procesa directamente a través del portal bancario tokenizado.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmPlanChange}
                className="px-4 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? 'Procesando con Pasarela...' : 'Confirmar y Actualizar Cuota'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
