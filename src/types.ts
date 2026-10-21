/**
 * Modelos de datos para FirmaDigital Chile
 * Plataforma SaaS Multiempresa de Gestión Documental y Firma Electrónica
 */

export type RoleType = 
  | 'superadmin'        // Superadministrador de la plataforma
  | 'admin_empresa'     // Administrador de la empresa
  | 'supervisor'        // Supervisor o encargado de documentos / prevención
  | 'trabajador'        // Trabajador o firmante
  | 'auditor';          // Auditor de solo lectura

export type SignatureType = 'simple' | 'avanzada';

export type DocumentStatus = 
  | 'borrador'
  | 'pendiente'
  | 'firmado'
  | 'rechazado'
  | 'vencido'
  | 'cancelado';

export type DocumentCategory = 
  | 'contrato'
  | 'anexo'
  | 'hoja_cargo'
  | 'epp'
  | 'autorizacion'
  | 'orden_trabajo'
  | 'administrativo';

export interface Tenant {
  id: string;
  rut: string;                     // RUT de la empresa (ej: 76.842.190-K)
  razonSocial: string;             // Razón Social
  nombreFantasia: string;          // Nombre de fantasía
  giro: string;                    // Giro comercial
  direccion: string;
  comuna: string;
  region: string;
  telefono: string;
  emailContacto: string;
  planId: 'inicial' | 'empresa' | 'profesional';
  estadoSuscripcion: 'activa' | 'prueba' | 'suspendida';
  limiteDocumentosMes: number;
  documentosConsumidosMes: number;
  limiteAlmacenamientoMb: number;
  almacenamientoUsadoMb: number;
  limiteUsuarios: number;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  nombreCompleto: string;
  rut: string;
  telefono?: string;
  mfaHabilitado: boolean;
  activo: boolean;
  currentTenantId: string;
  memberships: Membership[];
}

export interface Membership {
  tenantId: string;
  role: RoleType;
  cargo: string;
  activo: boolean;
}

export interface Worker {
  id: string;
  tenantId: string;
  rut: string;                     // RUT con formato
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  cargo: string;
  faenaUbicacion: string;          // Obra o faena (ej: Edificio Nueva Las Condes)
  fechaIngreso: string;
  estado: 'activo' | 'desvinculado' | 'vacaciones';
  afp?: string;
  salud?: 'Fonasa' | 'Isapre';
  herramientasAsignadasCount: number;
  eppAsignadosCount: number;
}

export interface Signer {
  id: string;
  workerId?: string;
  rut: string;
  nombreCompleto: string;
  email: string;
  cargo: string;
  ordenFirma: number;              // Orden secuencial de firma (1, 2, ...)
  estado: 'pendiente' | 'firmado' | 'rechazado';
  tipoFirma: SignatureType;
  fechaFirmaUtc?: string;
  fechaFirmaClt?: string;
  firmaImagenDataUrl?: string;     // Trazo visual de la firma en canvas
  ipAddress?: string;
  userAgent?: string;
  motivoRechazo?: string;
  cedulaSerie?: string;            // Número de serie de cédula para evidencia técnica
  metodoVerificacion?: 'DECLARACION_JURADA_CEDULA' | 'OTP_EMAIL' | 'CLAVE_UNICA_STUB';
}

export interface SignatureEvidence {
  signatureRequestId: string;
  documentId: string;
  documentVersion: number;
  documentHashSha256: string;
  verificationCode: string;
  textoAceptacionVersion: string;
  firmantes: Signer[];
  timestampUtc: string;
  timestampClt: string;
  certificadoGeneradoAt: string;
  legalNotice: string;
}

export interface Document {
  id: string;
  tenantId: string;
  titulo: string;
  categoria: DocumentCategory;
  tipoFirmaRequerida: SignatureType;
  estado: DocumentStatus;
  version: number;
  hashSha256: string;
  descripcion: string;
  contenidoTexto?: string;
  tamanoBytes: number;
  nombreArchivo: string;
  creadoPorUsuarioId: string;
  creadoPorNombre: string;
  trabajadorDestinatarioId?: string;
  trabajadorNombre?: string;
  trabajadorRut?: string;
  firmantes: Signer[];
  evidencia?: SignatureEvidence;
  fechaCreacion: string;
  fechaVencimiento: string;
  fechaCompletado?: string;
  metadata?: Record<string, any>;
}

export interface AssetTool {
  id: string;
  tenantId: string;
  codigoInventario: string;        // ej: HRR-TAL-042
  nombre: string;                  // ej: Taladro Percutor Inalámbrico 18V
  marca: string;                   // ej: Makita / DeWalt
  modelo: string;
  numeroSerie: string;
  estado: 'operativo' | 'asignado' | 'en_mantencion' | 'dado_de_baja';
  valorEstimadoClp: number;
  observaciones?: string;
}

export interface AssetAssignment {
  id: string;
  tenantId: string;
  assetId: string;
  assetCodigo: string;
  assetNombre: string;
  workerId: string;
  workerNombre: string;
  workerRut: string;
  fechaEntrega: string;
  fechaDevolucionEstimada?: string;
  fechaDevolucionReal?: string;
  estadoEntrega: 'NUEVO' | 'BUEN_ESTADO' | 'REGULAR';
  responsableEntrega: string;
  documentoCargoId?: string;
  estadoFirmaDocumento: DocumentStatus;
  observaciones: string;
}

export interface EppItem {
  nombre: string;
  tipo: 'cabeza' | 'ojos_rostro' | 'auditivo' | 'respiratorio' | 'manos' | 'pies' | 'ropa';
  marca: string;
  modeloTalla: string;
  certificacionNorma: string;      // ej: NCh 461 (Cascos), NCh 772/1 (Calzado)
  cantidad: number;
  estado: 'nuevo' | 'reemplazo';
}

export interface EppDelivery {
  id: string;
  tenantId: string;
  workerId: string;
  workerNombre: string;
  workerRut: string;
  workerCargo: string;
  faenaUbicacion: string;
  supervisorResponsable: string;
  fechaEntrega: string;
  items: EppItem[];
  documentoId?: string;
  estadoFirma: DocumentStatus;
  observacionesNormativas: string; // Cumplimiento DS 594 y Ley 16.744
}

export interface AuditEvent {
  id: string;
  tenantId: string;
  userId?: string;
  userNombre: string;
  userEmail: string;
  accion: string;                  // ej: DOCUMENT_CREATED, SIGNATURE_ACCEPTED, EPP_DELIVERED, CROSS_TENANT_ACCESS_BLOCKED
  recursoTipo: 'DOCUMENT' | 'SIGNATURE' | 'WORKER' | 'EPP' | 'ASSET' | 'TENANT' | 'AUTH';
  recursoId: string;
  detalles: string;
  ipAddress: string;
  timestamp: string;
  hashEvento: string;
}

export interface SubscriptionPlan {
  id: 'inicial' | 'empresa' | 'profesional';
  nombre: string;
  precioMensualClp: number;
  limiteDocumentosMes: number;
  limiteUsuarios: number;
  limiteAlmacenamientoMb: number;
  incluyeHojasCargoYEPP: boolean;
  incluyeApiRest: boolean;
  soporte: string;
  feaDisponible: boolean;
  descripcion: string;
}
