/**
 * Servicio de almacenamiento y simulación de base de datos Multiempresa con Row-Level Security
 * Implementa aislamiento estricto por tenantId y persistencia en localStorage.
 */
import { 
  Tenant, Worker, Document, AssetTool, AssetAssignment, 
  EppDelivery, AuditEvent, SubscriptionPlan, User, Signer, SignatureEvidence
} from '../types';
import { generateUUID, generateVerificationCode } from '../utils/crypto';

const STORAGE_KEY = 'firmadigital_chile_db_v1';

export const INITIAL_PLANS: SubscriptionPlan[] = [
  {
    id: 'inicial',
    nombre: 'Plan Inicial',
    precioMensualClp: 24990,
    limiteDocumentosMes: 30,
    limiteUsuarios: 2,
    limiteAlmacenamientoMb: 500,
    incluyeHojasCargoYEPP: true,
    incluyeApiRest: false,
    soporte: 'Soporte por correo en 24h',
    feaDisponible: false,
    descripcion: 'Diseñado para contratistas, subcontratos y pymes en etapa de formalización laboral.'
  },
  {
    id: 'empresa',
    nombre: 'Plan Empresa',
    precioMensualClp: 69990,
    limiteDocumentosMes: 250,
    limiteUsuarios: 8,
    limiteAlmacenamientoMb: 2500,
    incluyeHojasCargoYEPP: true,
    incluyeApiRest: true,
    soporte: 'Soporte prioritario WhatsApp y correo',
    feaDisponible: true,
    descripcion: 'El plan más elegido por empresas constructoras, industriales y de servicios en Chile.'
  },
  {
    id: 'profesional',
    nombre: 'Plan Profesional',
    precioMensualClp: 149900,
    limiteDocumentosMes: 1500,
    limiteUsuarios: 25,
    limiteAlmacenamientoMb: 10000,
    incluyeHojasCargoYEPP: true,
    incluyeApiRest: true,
    soporte: 'Ejecutivo de cuenta dedicado 24/7',
    feaDisponible: true,
    descripcion: 'Para grandes corporaciones, minería y empresas con múltiples centros de costos y obras.'
  }
];

export const INITIAL_TENANTS: Tenant[] = [
  {
    id: 'tenant-andina',
    rut: '76.842.190-K',
    razonSocial: 'Constructora Andina SpA',
    nombreFantasia: 'Andina Construcciones',
    giro: 'Construcción de edificios y obras de ingeniería civil',
    direccion: 'Av. Andrés Bello 2457, Piso 14',
    comuna: 'Providencia',
    region: 'Región Metropolitana',
    telefono: '+56 2 2984 5500',
    emailContacto: 'contacto@constructoraandina.cl',
    planId: 'empresa',
    estadoSuscripcion: 'activa',
    limiteDocumentosMes: 250,
    documentosConsumidosMes: 42,
    limiteAlmacenamientoMb: 2500,
    almacenamientoUsadoMb: 340,
    limiteUsuarios: 8,
    createdAt: '2026-01-15T08:00:00Z',
  },
  {
    id: 'tenant-minera',
    rut: '77.102.340-5',
    razonSocial: 'Servicios Mineros del Norte S.A.',
    nombreFantasia: 'Minera del Norte',
    giro: 'Servicios de sondaje, perforación y mantención minera',
    direccion: 'Av. Balmaceda 1020, Of. 602',
    comuna: 'Antofagasta',
    region: 'Región de Antofagasta',
    telefono: '+56 55 241 8900',
    emailContacto: 'operaciones@mineradelnorte.cl',
    planId: 'profesional',
    estadoSuscripcion: 'activa',
    limiteDocumentosMes: 1500,
    documentosConsumidosMes: 188,
    limiteAlmacenamientoMb: 10000,
    almacenamientoUsadoMb: 1420,
    limiteUsuarios: 25,
    createdAt: '2026-02-01T10:30:00Z',
  },
  {
    id: 'tenant-austral',
    rut: '76.549.882-1',
    razonSocial: 'Logística Austral Limitada',
    nombreFantasia: 'Austral Cargo Express',
    giro: 'Transporte de carga por carretera y almacenamiento',
    direccion: 'Ruta 5 Sur Km 1025',
    comuna: 'Puerto Montt',
    region: 'Región de Los Lagos',
    telefono: '+56 65 229 1100',
    emailContacto: 'gerencia@australcargo.cl',
    planId: 'inicial',
    estadoSuscripcion: 'activa',
    limiteDocumentosMes: 30,
    documentosConsumidosMes: 14,
    limiteAlmacenamientoMb: 500,
    almacenamientoUsadoMb: 85,
    limiteUsuarios: 2,
    createdAt: '2026-03-10T14:15:00Z',
  }
];

export const INITIAL_WORKERS: Worker[] = [
  // Trabajadores de Constructora Andina SpA
  {
    id: 'w-1',
    tenantId: 'tenant-andina',
    rut: '16.482.903-7',
    nombres: 'Rodrigo Alejandro',
    apellidos: 'Muñoz Valenzuela',
    email: 'rmunoz@constructoraandina.cl',
    telefono: '+56 9 8452 1190',
    cargo: 'Capataz de Enfierradura',
    faenaUbicacion: 'Obra Edificio Mirador Oriente (Providencia)',
    fechaIngreso: '2024-03-15',
    estado: 'activo',
    afp: 'Modelo',
    salud: 'Fonasa',
    herramientasAsignadasCount: 2,
    eppAsignadosCount: 4,
  },
  {
    id: 'w-2',
    tenantId: 'tenant-andina',
    rut: '17.391.042-4',
    nombres: 'Esteban Andrés',
    apellidos: 'Figueroa Carrasco',
    email: 'efigueroa@gmail.com',
    telefono: '+56 9 7621 3349',
    cargo: 'Maestro Mayor Carpintero',
    faenaUbicacion: 'Obra Edificio Mirador Oriente (Providencia)',
    fechaIngreso: '2024-05-02',
    estado: 'activo',
    afp: 'Habitat',
    salud: 'Fonasa',
    herramientasAsignadasCount: 1,
    eppAsignadosCount: 3,
  },
  {
    id: 'w-3',
    tenantId: 'tenant-andina',
    rut: '18.910.223-K',
    nombres: 'Camila Francisca',
    apellidos: 'Soto Araya',
    email: 'csoto@constructoraandina.cl',
    telefono: '+56 9 6190 2841',
    cargo: 'Experta en Prevención de Riesgos (SNS)',
    faenaUbicacion: 'Oficina Central / Obra Oriente',
    fechaIngreso: '2023-11-01',
    estado: 'activo',
    afp: 'Cuprum',
    salud: 'Isapre',
    herramientasAsignadasCount: 0,
    eppAsignadosCount: 2,
  },
  // Trabajadores de Servicios Mineros del Norte S.A.
  {
    id: 'w-4',
    tenantId: 'tenant-minera',
    rut: '15.719.820-2',
    nombres: 'Manuel Jesús',
    apellidos: 'Gutiérrez Pinto',
    email: 'mgutierrez@mineradelnorte.cl',
    telefono: '+56 9 9231 0041',
    cargo: 'Operador de Perforadora Jumbo',
    faenaUbicacion: 'Faena Mina Esperanza (Calama)',
    fechaIngreso: '2022-08-10',
    estado: 'activo',
    afp: 'PlanVital',
    salud: 'Fonasa',
    herramientasAsignadasCount: 3,
    eppAsignadosCount: 6,
  },
  {
    id: 'w-5',
    tenantId: 'tenant-minera',
    rut: '19.048.511-6',
    nombres: 'Ignacio Patricio',
    apellidos: 'Vargas Albornoz',
    email: 'ivargas@mineradelnorte.cl',
    telefono: '+56 9 8812 4477',
    cargo: 'Mecánico de Mantenimiento Pesado',
    faenaUbicacion: 'Taller Base Antofagasta',
    fechaIngreso: '2025-01-20',
    estado: 'activo',
    afp: 'Provida',
    salud: 'Fonasa',
    herramientasAsignadasCount: 4,
    eppAsignadosCount: 5,
  },
  // Trabajador de Logística Austral Ltda
  {
    id: 'w-6',
    tenantId: 'tenant-austral',
    rut: '14.882.310-9',
    nombres: 'Claudio Hernán',
    apellidos: 'Barrientos Mansilla',
    email: 'cbarrientos@australcargo.cl',
    telefono: '+56 9 7311 0922',
    cargo: 'Conductor de Tractocamión Semirremolque',
    faenaUbicacion: 'Ruta Puerto Montt - Punta Arenas',
    fechaIngreso: '2021-04-12',
    estado: 'activo',
    afp: 'Habitat',
    salud: 'Fonasa',
    herramientasAsignadasCount: 1,
    eppAsignadosCount: 3,
  }
];

export const INITIAL_DOCUMENTS: Document[] = [
  {
    id: 'doc-andina-001',
    tenantId: 'tenant-andina',
    titulo: 'Contrato de Trabajo a Plazo Indefinido - Rodrigo Muñoz',
    categoria: 'contrato',
    tipoFirmaRequerida: 'simple',
    estado: 'firmado',
    version: 1,
    hashSha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    descripcion: 'Contrato laboral estándar según Art. 10 del Código del Trabajo de Chile.',
    contenidoTexto: `CONTRATO DE TRABAJO INDEFINIDO

En Santiago de Chile, entre CONSTRUCTORA ANDINA SpA, RUT 76.842.190-K, domiciliada en Av. Andrés Bello 2457, Providencia, representada legalmente por don Hernán Silva Díaz, y don RODRIGO ALEJANDRO MUÑOZ VALENZUELA, RUT 16.482.903-7, de nacionalidad chilena, domiciliado en Pasaje Los Canelos 340, Maipú.

PRIMERO: El trabajador prestará servicios como Capataz de Enfierradura en la Obra Edificio Mirador Oriente o en las dependencias que el empleador determine dentro del radio urbano de la Región Metropolitana.
SEGUNDO: La jornada ordinaria de trabajo será de 40 horas semanales distribuidas de lunes a viernes.
TERCERO: El empleador pagará al trabajador una remuneración base mensual de $1.250.000 (un millón doscientos cincuenta mil pesos) más gratificación legal según Art. 47 y 50 del Código del Trabajo.
CUARTO: Ambas partes acuerdan suscribir el presente instrumento mediante Firma Electrónica Simple, al amparo del artículo 3° de la Ley N° 19.799 y la doctrina uniforme de la Dirección del Trabajo (Dictamen 789/15).`,
    tamanoBytes: 142000,
    nombreArchivo: 'Contrato_Rodrigo_Munoz_2024.pdf',
    creadoPorUsuarioId: 'u-admin-1',
    creadoPorNombre: 'Hernán Silva (Administrador)',
    trabajadorDestinatarioId: 'w-1',
    trabajadorNombre: 'Rodrigo Alejandro Muñoz Valenzuela',
    trabajadorRut: '16.482.903-7',
    fechaCreacion: '2026-03-01T09:00:00Z',
    fechaVencimiento: '2026-03-15T23:59:59Z',
    fechaCompletado: '2026-03-02T14:22:10Z',
    firmantes: [
      {
        id: 'sig-1',
        workerId: 'w-1',
        rut: '16.482.903-7',
        nombreCompleto: 'Rodrigo Alejandro Muñoz Valenzuela',
        email: 'rmunoz@constructoraandina.cl',
        cargo: 'Trabajador / Capataz',
        ordenFirma: 1,
        estado: 'firmado',
        tipoFirma: 'simple',
        fechaFirmaUtc: '2026-03-02T14:20:15Z',
        fechaFirmaClt: '02/03/2026 11:20:15 (CLT Santiago)',
        ipAddress: '190.161.42.115',
        userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-G991B) Chrome/122.0.0.0 Mobile Safari/537.36',
        cedulaSerie: 'A199248102',
        metodoVerificacion: 'DECLARACION_JURADA_CEDULA'
      },
      {
        id: 'sig-2',
        rut: '10.920.311-5',
        nombreCompleto: 'Hernán Silva Díaz',
        email: 'gerencia@constructoraandina.cl',
        cargo: 'Representante Legal Empleador',
        ordenFirma: 2,
        estado: 'firmado',
        tipoFirma: 'simple',
        fechaFirmaUtc: '2026-03-02T14:22:10Z',
        fechaFirmaClt: '02/03/2026 11:22:10 (CLT Santiago)',
        ipAddress: '200.54.120.33',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebkit/537.36 Chrome/122.0.0.0',
        metodoVerificacion: 'DECLARACION_JURADA_CEDULA'
      }
    ],
    evidencia: {
      signatureRequestId: 'sr-andina-001',
      documentId: 'doc-andina-001',
      documentVersion: 1,
      documentHashSha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      verificationCode: 'FD-CL-9842-8711',
      textoAceptacionVersion: 'v2.1-CL-LEY19799-DT',
      firmantes: [],
      timestampUtc: '2026-03-02T14:22:10Z',
      timestampClt: '02/03/2026 11:22:10 (CLT Santiago)',
      certificadoGeneradoAt: '2026-03-02T14:22:11Z',
      legalNotice: 'Suscrito con Firma Electrónica Simple bajo el Art. 3 Ley 19.799. Verificable en firmadigital.cl con código FD-CL-9842-8711.'
    }
  },
  {
    id: 'doc-andina-002',
    tenantId: 'tenant-andina',
    titulo: 'Hoja de Cargo y Entrega de Herramientas Eléctricas - Esteban Figueroa',
    categoria: 'hoja_cargo',
    tipoFirmaRequerida: 'simple',
    estado: 'pendiente',
    version: 1,
    hashSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    descripcion: 'Asignación en custodia de Sierra Circular y Atornillador de Impacto.',
    contenidoTexto: `ACTA DE ENTREGA EN CUSTODIA Y HOJA DE CARGO DE HERRAMIENTAS

EMPRESA: CONSTRUCTORA ANDINA SpA (RUT 76.842.190-K)
TRABAJADOR RECEPTOR: ESTEBAN ANDRÉS FIGUEROA CARRASCO (RUT 17.391.042-4)
FAENA: Obra Edificio Mirador Oriente, Providencia.

El trabajador individualizado recibe a su entera satisfacción los siguientes equipos para uso exclusivo en sus labores:
1. Sierra Circular Makita 7-1/4" mod. 5007N, Serie SN-MK-99120. Estado: BUENO.
2. Atornillador de Impacto DeWalt 20V mod. DCF887, Serie SN-DW-44109. Estado: NUEVO.

OBLIGACIONES DEL TRABAJADOR:
a) Custodiar debidamente las herramientas y mantenerlas en el pañol de obra al término de la jornada.
b) Reportar fallas o mantenciones de inmediato.
c) Devolver los bienes al término de la faena o requerimiento del empleador.`,
    tamanoBytes: 98000,
    nombreArchivo: 'Hoja_Cargo_Esteban_Figueroa.pdf',
    creadoPorUsuarioId: 'u-admin-1',
    creadoPorNombre: 'Hernán Silva (Administrador)',
    trabajadorDestinatarioId: 'w-2',
    trabajadorNombre: 'Esteban Andrés Figueroa Carrasco',
    trabajadorRut: '17.391.042-4',
    fechaCreacion: '2026-03-10T11:00:00Z',
    fechaVencimiento: '2026-03-24T23:59:59Z',
    firmantes: [
      {
        id: 'sig-3',
        workerId: 'w-2',
        rut: '17.391.042-4',
        nombreCompleto: 'Esteban Andrés Figueroa Carrasco',
        email: 'efigueroa@gmail.com',
        cargo: 'Maestro Mayor Carpintero',
        ordenFirma: 1,
        estado: 'pendiente',
        tipoFirma: 'simple'
      }
    ]
  },
  {
    id: 'doc-minera-001',
    tenantId: 'tenant-minera',
    titulo: 'Anexo de Traslado de Turno 7x7 Mina Subterránea - Manuel Gutiérrez',
    categoria: 'anexo',
    tipoFirmaRequerida: 'simple',
    estado: 'firmado',
    version: 1,
    hashSha256: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    descripcion: 'Pacto de jornada excepcional autorizada por Resolución DT Antofagasta.',
    contenidoTexto: `ANEXO DE CONTRATO DE TRABAJO - JORNADA EXCEPCIONAL 7x7

Entre SERVICIOS MINEROS DEL NORTE S.A. (RUT 77.102.340-5) y don MANUEL JESÚS GUTIÉRREZ PINTO (RUT 15.719.820-2).
Se acuerda la incorporación al sistema excepcional de turnos de 7 días continuos de trabajo seguidos de 7 días continuos de descanso, en Faena Esperanza, Calama, con jornada diaria de 12 horas.`,
    tamanoBytes: 110000,
    nombreArchivo: 'Anexo_Jornada_7x7_Gutiérrez.pdf',
    creadoPorUsuarioId: 'u-minera-1',
    creadoPorNombre: 'Patricia Morales (Jefa RRHH)',
    trabajadorDestinatarioId: 'w-4',
    trabajadorNombre: 'Manuel Jesús Gutiérrez Pinto',
    trabajadorRut: '15.719.820-2',
    fechaCreacion: '2026-02-15T15:00:00Z',
    fechaVencimiento: '2026-03-01T23:59:59Z',
    fechaCompletado: '2026-02-16T18:40:00Z',
    firmantes: [
      {
        id: 'sig-4',
        workerId: 'w-4',
        rut: '15.719.820-2',
        nombreCompleto: 'Manuel Jesús Gutiérrez Pinto',
        email: 'mgutierrez@mineradelnorte.cl',
        cargo: 'Operador Jumbo',
        ordenFirma: 1,
        estado: 'firmado',
        tipoFirma: 'simple',
        fechaFirmaUtc: '2026-02-16T18:40:00Z',
        fechaFirmaClt: '16/02/2026 15:40:00 (CLT)',
        ipAddress: '186.105.77.204',
        cedulaSerie: 'B203918233'
      }
    ]
  }
];

export const INITIAL_ASSETS: AssetTool[] = [
  {
    id: 'ast-1',
    tenantId: 'tenant-andina',
    codigoInventario: 'HRR-AND-01',
    nombre: 'Sierra Circular 7-1/4" 1800W',
    marca: 'Makita',
    modelo: '5007N',
    numeroSerie: 'SN-MK-99120',
    estado: 'asignado',
    valorEstimadoClp: 185000,
    observaciones: 'Asignada a Esteban Figueroa (Maestro Mayor)'
  },
  {
    id: 'ast-2',
    tenantId: 'tenant-andina',
    codigoInventario: 'HRR-AND-02',
    nombre: 'Atornillador de Impacto 20V MAX',
    marca: 'DeWalt',
    modelo: 'DCF887',
    numeroSerie: 'SN-DW-44109',
    estado: 'asignado',
    valorEstimadoClp: 219900,
    observaciones: 'Asignada a Esteban Figueroa'
  },
  {
    id: 'ast-3',
    tenantId: 'tenant-andina',
    codigoInventario: 'HRR-AND-03',
    nombre: 'Rotomartillo SDS-Plus 800W',
    marca: 'Bosch Professional',
    modelo: 'GBH 2-28',
    numeroSerie: 'SN-BSH-88210',
    estado: 'operativo',
    valorEstimadoClp: 260000,
    observaciones: 'En pañol de obra disponible para asignación'
  },
  {
    id: 'ast-4',
    tenantId: 'tenant-minera',
    codigoInventario: 'HRR-MIN-104',
    nombre: 'Torquímetro Digital de Precisión 1/2"',
    marca: 'Snap-on',
    modelo: 'ATECH3FR250B',
    numeroSerie: 'SN-SNP-71029',
    estado: 'asignado',
    valorEstimadoClp: 680000,
    observaciones: 'Asignado a Manuel Gutiérrez'
  }
];

export const INITIAL_EPP_DELIVERIES: EppDelivery[] = [
  {
    id: 'epp-del-001',
    tenantId: 'tenant-andina',
    workerId: 'w-1',
    workerNombre: 'Rodrigo Alejandro Muñoz Valenzuela',
    workerRut: '16.482.903-7',
    workerCargo: 'Capataz de Enfierradura',
    faenaUbicacion: 'Obra Edificio Mirador Oriente (Providencia)',
    supervisorResponsable: 'Camila Soto Araya (Prevención de Riesgos)',
    fechaEntrega: '2026-03-01',
    estadoFirma: 'firmado',
    observacionesNormativas: 'Entrega según matriz de riesgos y D.S. 594 Art. 68. Capacitación de uso realizada.',
    items: [
      {
        nombre: 'Casco de Seguridad Tipo I Clase E con Barbiquejo',
        tipo: 'cabeza',
        marca: 'MSA',
        modeloTalla: 'V-Gard Estándar',
        certificacionNorma: 'NCh 461 / ANSI Z89.1',
        cantidad: 1,
        estado: 'nuevo'
      },
      {
        nombre: 'Calzado de Seguridad Dieléctrico con Puntera Composite',
        tipo: 'pies',
        marca: 'Norseg',
        modeloTalla: 'Titanium Talla 42',
        certificacionNorma: 'NCh 772/1 Of.92',
        cantidad: 1,
        estado: 'nuevo'
      },
      {
        nombre: 'Antiparras de Seguridad Policarbonato Antiempaño UV',
        tipo: 'ojos_rostro',
        marca: '3M',
        modeloTalla: 'Virtua CCS Claro',
        certificacionNorma: 'ANSI Z87.1 / NCh 1301',
        cantidad: 2,
        estado: 'nuevo'
      },
      {
        nombre: 'Guantes de Cabritilla Reforzada para Enfierrador',
        tipo: 'manos',
        marca: 'Steelpro',
        modeloTalla: 'Talla 9 (L)',
        certificacionNorma: 'EN 388 / NCh 1115',
        cantidad: 3,
        estado: 'nuevo'
      }
    ]
  },
  {
    id: 'epp-del-002',
    tenantId: 'tenant-minera',
    workerId: 'w-4',
    workerNombre: 'Manuel Jesús Gutiérrez Pinto',
    workerRut: '15.719.820-2',
    workerCargo: 'Operador Perforadora Jumbo',
    faenaUbicacion: 'Faena Mina Esperanza (Calama)',
    supervisorResponsable: 'Hernán Carrasco (Jefe de Seguridad Minera)',
    fechaEntrega: '2026-02-10',
    estadoFirma: 'firmado',
    observacionesNormativas: 'Dotación EPP para minería subterránea según Decreto Supremo N° 132 (Reglamento de Seguridad Minera).',
    items: [
      {
        nombre: 'Respirador Medio Rostro de Silicona con Filtros P100 Polvo/Sílice',
        tipo: 'respiratorio',
        marca: '3M',
        modeloTalla: 'Serie 7502 (M)',
        certificacionNorma: 'NIOSH P100 / NCh 1258',
        cantidad: 1,
        estado: 'nuevo'
      },
      {
        nombre: 'Protector Auditivo Tipo Fono para Casco Minero 27dB',
        tipo: 'auditivo',
        marca: 'Howard Leight',
        modeloTalla: 'Leightning L1H',
        certificacionNorma: 'ANSI S3.19 / NCh 1331',
        cantidad: 1,
        estado: 'nuevo'
      }
    ]
  }
];

export const INITIAL_AUDIT_LOGS: AuditEvent[] = [
  {
    id: 'aud-001',
    tenantId: 'tenant-andina',
    userId: 'u-admin-1',
    userNombre: 'Hernán Silva Díaz',
    userEmail: 'gerencia@constructoraandina.cl',
    accion: 'DOCUMENT_CREATED',
    recursoTipo: 'DOCUMENT',
    recursoId: 'doc-andina-001',
    detalles: 'Creación de borrador de Contrato Indefinido para Rodrigo Muñoz Valenzuela.',
    ipAddress: '200.54.120.33',
    timestamp: '2026-03-01T09:00:00Z',
    hashEvento: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0'
  },
  {
    id: 'aud-002',
    tenantId: 'tenant-andina',
    userId: 'w-1',
    userNombre: 'Rodrigo Alejandro Muñoz Valenzuela',
    userEmail: 'rmunoz@constructoraandina.cl',
    accion: 'SIGNATURE_ACCEPTED',
    recursoTipo: 'SIGNATURE',
    recursoId: 'doc-andina-001',
    detalles: 'Firma Electrónica Simple suscrita mediante trazo en pantalla y verificación de RUT 16.482.903-7.',
    ipAddress: '190.161.42.115',
    timestamp: '2026-03-02T14:20:15Z',
    hashEvento: 'b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef01'
  },
  {
    id: 'aud-003',
    tenantId: 'tenant-andina',
    userId: 'u-admin-1',
    userNombre: 'Hernán Silva Díaz',
    userEmail: 'gerencia@constructoraandina.cl',
    accion: 'SIGNATURE_COMPLETED',
    recursoTipo: 'DOCUMENT',
    recursoId: 'doc-andina-001',
    detalles: 'Proceso de firma completado con sellado de tiempo UTC/CLT y generación de Certificado FD-CL-9842-8711.',
    ipAddress: '200.54.120.33',
    timestamp: '2026-03-02T14:22:10Z',
    hashEvento: 'c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef012'
  }
];

class StorageService {
  private tenants: Tenant[] = [];
  private workers: Worker[] = [];
  private documents: Document[] = [];
  private assets: AssetTool[] = [];
  private eppDeliveries: EppDelivery[] = [];
  private auditLogs: AuditEvent[] = [];

  constructor() {
    this.load();
  }

  private load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        this.tenants = data.tenants || INITIAL_TENANTS;
        this.workers = data.workers || INITIAL_WORKERS;
        this.documents = data.documents || INITIAL_DOCUMENTS;
        this.assets = data.assets || INITIAL_ASSETS;
        this.eppDeliveries = data.eppDeliveries || INITIAL_EPP_DELIVERIES;
        this.auditLogs = data.auditLogs || INITIAL_AUDIT_LOGS;
        return;
      }
    } catch {
      // Fallback
    }
    this.resetToDefaults();
  }

  public save() {
    try {
      const data = {
        tenants: this.tenants,
        workers: this.workers,
        documents: this.documents,
        assets: this.assets,
        eppDeliveries: this.eppDeliveries,
        auditLogs: this.auditLogs,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error('Error saving to localStorage', err);
    }
  }

  public resetToDefaults() {
    this.tenants = JSON.parse(JSON.stringify(INITIAL_TENANTS));
    this.workers = JSON.parse(JSON.stringify(INITIAL_WORKERS));
    this.documents = JSON.parse(JSON.stringify(INITIAL_DOCUMENTS));
    this.assets = JSON.parse(JSON.stringify(INITIAL_ASSETS));
    this.eppDeliveries = JSON.parse(JSON.stringify(INITIAL_EPP_DELIVERIES));
    this.auditLogs = JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS));
    this.save();
  }

  // TENANT ISOLATION QUERIES (RLS Simulado Estricto)
  public getTenants(): Tenant[] {
    return [...this.tenants];
  }

  public getTenantById(id: string): Tenant | undefined {
    return this.tenants.find((t) => t.id === id);
  }

  public updateTenant(updated: Tenant): void {
    const idx = this.tenants.findIndex(t => t.id === updated.id);
    if (idx !== -1) {
      this.tenants[idx] = updated;
      this.save();
    }
  }

  public getDocuments(tenantId: string): Document[] {
    // Estricto: solo documentos pertenecientes a la empresa activa
    return this.documents.filter((d) => d.tenantId === tenantId);
  }

  public getDocumentById(tenantId: string, docId: string): Document | null {
    const doc = this.documents.find((d) => d.id === docId);
    if (!doc) return null;
    // Comprobación de aislamiento RLS
    if (doc.tenantId !== tenantId) {
      this.recordSecurityViolation(tenantId, 'CROSS_TENANT_DOCUMENT_ACCESS_BLOCKED', docId);
      return null;
    }
    return doc;
  }

  public getDocumentByVerificationCode(code: string): Document | null {
    const clean = code.trim().toUpperCase();
    return this.documents.find((d) => d.evidencia?.verificationCode === clean || d.id === clean) || null;
  }

  public addDocument(doc: Document): void {
    // Verificar cuota de consumo del plan
    const tenant = this.getTenantById(doc.tenantId);
    if (tenant) {
      tenant.documentosConsumidosMes += 1;
      this.updateTenant(tenant);
    }
    this.documents.unshift(doc);
    this.addAuditLog({
      id: generateUUID(),
      tenantId: doc.tenantId,
      userNombre: doc.creadoPorNombre || 'Usuario Autorizado',
      userEmail: 'operaciones@empresa.cl',
      accion: 'DOCUMENT_CREATED',
      recursoTipo: 'DOCUMENT',
      recursoId: doc.id,
      detalles: `Documento creado: "${doc.titulo}" (${doc.categoria}) con hash ${doc.hashSha256.slice(0, 12)}...`,
      ipAddress: '190.161.42.115',
      timestamp: new Date().toISOString(),
      hashEvento: doc.hashSha256
    });
    this.save();
  }

  public updateDocument(doc: Document): void {
    const idx = this.documents.findIndex(d => d.id === doc.id);
    if (idx !== -1) {
      this.documents[idx] = doc;
      this.save();
    }
  }

  public getWorkers(tenantId: string): Worker[] {
    return this.workers.filter((w) => w.tenantId === tenantId);
  }

  public addWorker(worker: Worker): void {
    this.workers.push(worker);
    this.addAuditLog({
      id: generateUUID(),
      tenantId: worker.tenantId,
      userNombre: 'Administrador de Empresa',
      userEmail: 'rrhh@empresa.cl',
      accion: 'WORKER_REGISTERED',
      recursoTipo: 'WORKER',
      recursoId: worker.id,
      detalles: `Trabajador registrado: ${worker.nombres} ${worker.apellidos} (RUT: ${worker.rut}, Cargo: ${worker.cargo})`,
      ipAddress: '190.161.42.115',
      timestamp: new Date().toISOString(),
      hashEvento: generateUUID()
    });
    this.save();
  }

  public getAssets(tenantId: string): AssetTool[] {
    return this.assets.filter((a) => a.tenantId === tenantId);
  }

  public addAsset(asset: AssetTool): void {
    this.assets.push(asset);
    this.save();
  }

  public getEppDeliveries(tenantId: string): EppDelivery[] {
    return this.eppDeliveries.filter((e) => e.tenantId === tenantId);
  }

  public addEppDelivery(delivery: EppDelivery): void {
    this.eppDeliveries.unshift(delivery);
    this.addAuditLog({
      id: generateUUID(),
      tenantId: delivery.tenantId,
      userNombre: delivery.supervisorResponsable,
      userEmail: 'prevencion@empresa.cl',
      accion: 'EPP_DELIVERY_RECORDED',
      recursoTipo: 'EPP',
      recursoId: delivery.id,
      detalles: `Entrega de EPP formalizada a ${delivery.workerNombre} (${delivery.items.length} ítems según D.S. 594)`,
      ipAddress: '190.161.42.115',
      timestamp: new Date().toISOString(),
      hashEvento: generateUUID()
    });
    this.save();
  }

  public getAuditLogs(tenantId: string): AuditEvent[] {
    return this.auditLogs
      .filter((l) => l.tenantId === tenantId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public addAuditLog(log: AuditEvent): void {
    this.auditLogs.unshift(log);
    this.save();
  }

  public recordSecurityViolation(actingTenantId: string, action: string, targetResourceId: string): void {
    const violation: AuditEvent = {
      id: generateUUID(),
      tenantId: actingTenantId,
      userNombre: 'Seguridad / Row-Level Security',
      userEmail: 'security@firmadigital.cl',
      accion: action,
      recursoTipo: 'DOCUMENT',
      recursoId: targetResourceId,
      detalles: `ALERTA DE SEGURIDAD: Intento de acceso cruzado entre empresas bloqueado por RLS. Tenant solicitante: ${actingTenantId}, Recurso ajeno: ${targetResourceId}`,
      ipAddress: '190.161.42.115',
      timestamp: new Date().toISOString(),
      hashEvento: generateUUID()
    };
    this.auditLogs.unshift(violation);
    this.save();
  }

  /**
   * Intento deliberado de acceso cruzado para pruebas de seguridad en vivo
   */
  public simulateCrossTenantAttack(actingTenantId: string, otherTenantDocId: string): { success: boolean; message: string } {
    const doc = this.documents.find(d => d.id === otherTenantDocId);
    if (!doc) {
      return { success: false, message: 'El documento no existe.' };
    }
    if (doc.tenantId === actingTenantId) {
      return { success: true, message: 'El documento pertenece a su propia empresa, acceso concedido.' };
    }

    // Registrar violación y denegar
    this.recordSecurityViolation(actingTenantId, 'CROSS_TENANT_ATTACK_PREVENTED', otherTenantDocId);
    return {
      success: false,
      message: `ACCESO DENEGADO (HTTP 403 Forbidden). La política Row-Level Security (RLS) impidió acceder al documento ${otherTenantDocId} perteneciente a ${doc.tenantId}. Se registró un evento de seguridad inmutable.`
    };
  }
}

export const storage = new StorageService();
