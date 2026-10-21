/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { storage } from './services/mockStorage';
import { Tenant, RoleType, Document, Worker, AssetTool, EppDelivery, AuditEvent } from './types';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { DocumentsView } from './components/DocumentsView';
import { AssetCargoView } from './components/AssetCargoView';
import { EppDeliveryView } from './components/EppDeliveryView';
import { WorkersView } from './components/WorkersView';
import { PublicVerificationView } from './components/PublicVerificationView';
import { AuditLogView } from './components/AuditLogView';
import { SubscriptionView } from './components/SubscriptionView';
import { SettingsView } from './components/SettingsView';
import { CreateDocumentModal } from './components/CreateDocumentModal';
import { SigningPortalModal } from './components/SigningPortalModal';
import { SecurityTestModal } from './components/SecurityTestModal';

export default function App() {
  const [tenants, setTenants] = useState<Tenant[]>(storage.getTenants());
  const [currentTenantId, setCurrentTenantId] = useState<string>('tenant-andina');
  const [currentRole, setCurrentRole] = useState<RoleType>('admin_empresa');
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isOpenMobileSidebar, setIsOpenMobileSidebar] = useState(false);

  // Modales
  const [showCreateDocModal, setShowCreateDocModal] = useState(false);
  const [docToSign, setDocToSign] = useState<Document | null>(null);
  const [showSecurityTestModal, setShowSecurityTestModal] = useState(false);

  // Tenant actual
  const currentTenant = tenants.find((t) => t.id === currentTenantId) || tenants[0];

  // Datos filtrados por el Tenant activo (Aislamiento RLS Estricto)
  const [documents, setDocuments] = useState<Document[]>(storage.getDocuments(currentTenant.id));
  const [workers, setWorkers] = useState<Worker[]>(storage.getWorkers(currentTenant.id));
  const [assets, setAssets] = useState<AssetTool[]>(storage.getAssets(currentTenant.id));
  const [eppDeliveries, setEppDeliveries] = useState<EppDelivery[]>(storage.getEppDeliveries(currentTenant.id));
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>(storage.getAuditLogs(currentTenant.id));

  // Recargar al cambiar de tenant
  useEffect(() => {
    refreshTenantData(currentTenantId);
  }, [currentTenantId]);

  // Listener para enlaces de firma directa tipo hash #firmar/doc-xxx
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#firmar/')) {
        const docId = hash.replace('#firmar/', '').trim();
        const doc = storage.getDocumentById(currentTenantId, docId);
        if (doc) {
          setDocToSign(doc);
        }
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [currentTenantId]);

  const refreshTenantData = (tenantId: string) => {
    setDocuments(storage.getDocuments(tenantId));
    setWorkers(storage.getWorkers(tenantId));
    setAssets(storage.getAssets(tenantId));
    setEppDeliveries(storage.getEppDeliveries(tenantId));
    setAuditLogs(storage.getAuditLogs(tenantId));
  };

  const handleSelectTenant = (tenantId: string) => {
    setCurrentTenantId(tenantId);
  };

  const handleDocumentCreated = (newDoc: Document) => {
    refreshTenantData(currentTenant.id);
  };

  const handleSignedSuccess = (updatedDoc: Document) => {
    refreshTenantData(currentTenant.id);
  };

  const handleResetFactory = () => {
    storage.resetToDefaults();
    setTenants(storage.getTenants());
    setCurrentTenantId('tenant-andina');
    refreshTenantData('tenant-andina');
  };

  return (
    <div className="min-h-screen bg-[#091522] text-slate-100 flex flex-col antialiased">
      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isOpenMobile={isOpenMobileSidebar}
          onCloseMobile={() => setIsOpenMobileSidebar(false)}
          tenant={currentTenant}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header
            currentTenant={currentTenant}
            tenants={tenants}
            onSelectTenant={handleSelectTenant}
            currentRole={currentRole}
            onSelectRole={setCurrentRole}
            onToggleSidebar={() => setIsOpenMobileSidebar(!isOpenMobileSidebar)}
            onOpenSecurityTest={() => setShowSecurityTestModal(true)}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardView
                tenant={currentTenant}
                documents={documents}
                workers={workers}
                assets={assets}
                eppDeliveries={eppDeliveries}
                onOpenCreateDocument={() => setShowCreateDocModal(true)}
                onOpenSignDocument={(doc) => setDocToSign(doc)}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'documents' && (
              <DocumentsView
                documents={documents}
                onOpenCreateDocument={() => setShowCreateDocModal(true)}
                onOpenSignDocument={(doc) => setDocToSign(doc)}
              />
            )}

            {activeTab === 'cargo' && (
              <AssetCargoView
                tenant={currentTenant}
                assets={assets}
                workers={workers}
                onDocumentCreated={handleDocumentCreated}
                onOpenSignDocument={(doc) => setDocToSign(doc)}
              />
            )}

            {activeTab === 'epp' && (
              <EppDeliveryView
                tenant={currentTenant}
                workers={workers}
                deliveries={eppDeliveries}
                onDocumentCreated={handleDocumentCreated}
                onOpenSignDocument={(doc) => setDocToSign(doc)}
              />
            )}

            {activeTab === 'workers' && (
              <WorkersView
                tenant={currentTenant}
                workers={workers}
                onWorkerAdded={() => refreshTenantData(currentTenant.id)}
              />
            )}

            {activeTab === 'verification' && (
              <PublicVerificationView />
            )}

            {activeTab === 'audit' && (
              <AuditLogView
                tenant={currentTenant}
                logs={auditLogs}
              />
            )}

            {activeTab === 'subscription' && (
              <SubscriptionView
                tenant={currentTenant}
                onTenantUpdated={(updated) => {
                  setTenants(storage.getTenants());
                  refreshTenantData(updated.id);
                }}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                tenant={currentTenant}
                onTenantUpdated={(updated) => {
                  setTenants(storage.getTenants());
                  refreshTenantData(updated.id);
                }}
                onResetFactoryData={handleResetFactory}
              />
            )}
          </main>
        </div>
      </div>

      {/* Modales globales */}
      {showCreateDocModal && (
        <CreateDocumentModal
          tenant={currentTenant}
          workers={workers}
          onClose={() => setShowCreateDocModal(false)}
          onDocumentCreated={handleDocumentCreated}
        />
      )}

      {docToSign && (
        <SigningPortalModal
          document={docToSign}
          onClose={() => setDocToSign(null)}
          onSignedSuccess={handleSignedSuccess}
        />
      )}

      {showSecurityTestModal && (
        <SecurityTestModal
          currentTenant={currentTenant}
          tenants={tenants}
          onClose={() => setShowSecurityTestModal(false)}
          onRefreshAudit={() => refreshTenantData(currentTenant.id)}
        />
      )}
    </div>
  );
}
