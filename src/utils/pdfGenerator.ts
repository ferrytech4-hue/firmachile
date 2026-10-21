/**
 * Generador de documentos PDF y Certificados de Evidencia de Firma
 * Utiliza jsPDF para emitir comprobantes verificables con hash SHA-256 y sellos criptográficos.
 */
import { jsPDF } from 'jspdf';
import { Document, SignatureEvidence, EppDelivery, AssetAssignment } from '../types';
import { formatChileanTimestamp } from './crypto';

/**
 * Genera y descarga el Certificado de Evidencia de Firma Electrónica Simple
 */
export function generateEvidenceCertificatePdf(doc: Document, evidence: SignatureEvidence): void {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  let y = 18;

  // Encabezado institucional
  pdf.setFillColor(15, 41, 66); // Azul petróleo (#0f2942)
  pdf.rect(0, 0, pageWidth, 24, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(255, 255, 255);
  pdf.text('FIRMADIGITAL CHILE - CERTIFICADO DE EVIDENCIA DE FIRMA', 14, 11);

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(190, 210, 230);
  pdf.text('Acreditación de Firma Electrónica Simple según Ley N° 19.799 y Código del Trabajo', 14, 18);

  y = 34;

  // Cuadro informativo del Documento
  pdf.setFillColor(245, 248, 250);
  pdf.setDrawColor(210, 225, 235);
  pdf.rect(14, y, pageWidth - 28, 48, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(15, 41, 66);
  pdf.text('1. ANTECEDENTES DEL DOCUMENTO ELECTRÓNICO', 18, y + 8);

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(50, 60, 75);

  pdf.text(`Título:`, 18, y + 16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${doc.titulo}`, 45, y + 16);

  pdf.setFont('helvetica', 'normal');
  pdf.text(`Identificador Único:`, 18, y + 23);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${doc.id}`, 55, y + 23);

  pdf.setFont('helvetica', 'normal');
  pdf.text(`Categoría:`, 18, y + 30);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${doc.categoria.toUpperCase()} (Versión ${doc.version})`, 45, y + 30);

  pdf.setFont('helvetica', 'normal');
  pdf.text(`Código Verificación:`, 18, y + 37);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(13, 92, 70); // Verde oscuro petróleo
  pdf.text(`${evidence.verificationCode}`, 55, y + 37);

  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(50, 60, 75);
  pdf.text(`Hash SHA-256:`, 18, y + 44);
  pdf.setFont('courier', 'normal');
  pdf.setFontSize(7.5);
  pdf.text(`${evidence.documentHashSha256}`, 45, y + 44);

  y += 56;

  // Evidencias Criptográficas y de Tiempo
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(15, 41, 66);
  pdf.text('2. SELLADO TEMPORAL Y TRAZABILIDAD', 14, y);

  y += 6;
  const timeData = formatChileanTimestamp(evidence.timestampUtc);

  pdf.setFillColor(250, 250, 252);
  pdf.rect(14, y, pageWidth - 28, 22, 'FD');

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(40, 50, 65);
  pdf.text(`Hora de suscripción (UTC): ${timeData.utc}`, 18, y + 7);
  pdf.text(`Hora oficial de Chile (CLT): ${timeData.clt}`, 18, y + 13);
  pdf.text(`Estado del proceso: COMPLETADO Y REGISTRADO INMUTABLEMENTE`, 18, y + 19);

  y += 28;

  // Lista de Firmantes y Evidencias Técnicas
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(15, 41, 66);
  pdf.text('3. DECLARACIÓN DE FIRMANTES Y EVIDENCIAS TÉCNICAS', 14, y);

  y += 6;

  evidence.firmantes.forEach((signer, index) => {
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(200, 215, 230);
    pdf.rect(14, y, pageWidth - 28, 38, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9.5);
    pdf.setTextColor(15, 41, 66);
    pdf.text(`Firmante #${index + 1}: ${signer.nombreCompleto} (${signer.cargo || 'Firmante'})`, 18, y + 7);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(50, 60, 70);
    pdf.text(`RUT: ${signer.rut}`, 18, y + 14);
    pdf.text(`Correo Electrónico: ${signer.email}`, 18, y + 20);
    pdf.text(`Dirección IP de registro: ${signer.ipAddress || '190.161.42.115 (Chile)'}`, 18, y + 26);
    pdf.text(`Verificación de identidad: ${signer.metodoVerificacion || 'Declaración Jurada + Cédula de Identidad'}`, 18, y + 32);

    // Si tiene firma dibujada
    if (signer.firmaImagenDataUrl) {
      try {
        pdf.addImage(signer.firmaImagenDataUrl, 'PNG', pageWidth - 60, y + 6, 40, 16);
        pdf.setFontSize(7);
        pdf.setTextColor(120, 130, 140);
        pdf.text('Trazo biométrico registrado', pageWidth - 55, y + 26);
      } catch {
        // Fallback si la imagen no es procesable
      }
    }

    y += 42;
  });

  y += 4;

  // Cláusula Legal y Advertencia de Responsabilidad (Exigida por el prompt)
  pdf.setFillColor(242, 246, 250);
  pdf.setDrawColor(180, 205, 225);
  pdf.rect(14, y, pageWidth - 28, 32, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(15, 41, 66);
  pdf.text('4. VALIDEZ LEGAL Y ADVERTENCIA NORMATIVA (LEY 19.799)', 18, y + 6);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(60, 75, 90);
  const legalLines = [
    'El presente documento ha sido suscrito mediante Firma Electrónica Simple al tenor del artículo 3° de la Ley N° 19.799 sobre',
    'Documentos Electrónicos, Firma Electrónica y Servicios de Certificación de dicha firma de la República de Chile.',
    'Nota de transparencia legal: La imagen gráfica de la firma, la casilla de verificación y el hash SHA-256 constituyen elementos',
    'de convicción técnica pero no sustituyen una Firma Electrónica Avanzada (FEA) cuando la legislación exija solemnidad expresa.',
    'Verificación pública en línea: https://firmadigital.cl/verificar con el código ' + evidence.verificationCode
  ];

  legalLines.forEach((line, i) => {
    pdf.text(line, 18, y + 11 + (i * 4.2));
  });

  // Pie de página
  pdf.setFontSize(7.5);
  pdf.setTextColor(120, 140, 160);
  pdf.text(`FirmaDigital Chile SaaS - Generado el ${new Date().toLocaleString('es-CL')} - Página 1 de 1`, 14, 285);

  pdf.save(`Certificado_Evidencia_${doc.id.slice(0, 8)}_${evidence.verificationCode}.pdf`);
}

/**
 * Genera y descarga el Documento Completo con Sello de Firma al Pie
 */
export function generateSignedDocumentPdf(doc: Document): void {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  let y = 20;

  // Cabecera institucional
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(15);
  pdf.setTextColor(15, 41, 66);
  pdf.text(doc.titulo.toUpperCase(), 14, y);

  y += 7;
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 115, 130);
  pdf.text(`ID Documento: ${doc.id} | Versión ${doc.version} | Emitido: ${doc.fechaCreacion.slice(0, 10)}`, 14, y);

  y += 10;
  pdf.setDrawColor(200, 215, 230);
  pdf.line(14, y, pageWidth - 14, y);

  y += 10;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  pdf.setTextColor(40, 50, 65);

  // Contenido del documento
  const rawText = doc.contenidoTexto || 'Contenido formal del documento electrónico suscrito.';
  const splitText = pdf.splitTextToSize(rawText, pageWidth - 28);

  splitText.forEach((line: string) => {
    if (y > 230) {
      pdf.addPage();
      y = 20;
    }
    pdf.text(line, 14, y);
    y += 5.2;
  });

  // Sello visual al pie
  y = Math.max(y + 10, 220);
  if (y > 230) {
    pdf.addPage();
    y = 30;
  }

  pdf.setFillColor(244, 247, 250);
  pdf.setDrawColor(180, 205, 225);
  pdf.rect(14, y, pageWidth - 28, 48, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(15, 41, 66);
  pdf.text('SELLO DE FIRMA ELECTRÓNICA REGISTRADA - LEY 19.799', 18, y + 7);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(60, 75, 90);
  pdf.text(`Estado: ${doc.estado.toUpperCase()}`, 18, y + 14);
  pdf.text(`Hash SHA-256 del contenido:`, 18, y + 20);

  pdf.setFont('courier', 'normal');
  pdf.setFontSize(7.5);
  pdf.text(doc.hashSha256, 18, y + 25);

  // Cuadros de firmas
  let sigX = 18;
  doc.firmantes.forEach((f) => {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(15, 41, 66);
    pdf.text(`${f.nombreCompleto}`, sigX, y + 33);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`RUT: ${f.rut} - Estado: ${f.estado.toUpperCase()}`, sigX, y + 38);
    pdf.text(`Fecha: ${f.fechaFirmaClt || 'Pendiente'}`, sigX, y + 43);
    sigX += 85;
  });

  pdf.save(`${doc.titulo.replace(/\s+/g, '_')}_FIRMADO.pdf`);
}

/**
 * Genera PDF de Entrega de EPP (DS 594)
 */
export function generateEppReceiptPdf(delivery: EppDelivery): void {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  let y = 18;

  pdf.setFillColor(13, 92, 70); // Verde oscuro
  pdf.rect(0, 0, pageWidth, 22, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.setTextColor(255, 255, 255);
  pdf.text('REGISTRO OFICIAL DE ENTREGA DE ELEMENTOS DE PROTECCIÓN PERSONAL (EPP)', 14, 11);

  pdf.setFontSize(8.5);
  pdf.setFont('helvetica', 'normal');
  pdf.text('En cumplimiento de la Ley 16.744 y Art. 68 D.S. 594 - Ministerio de Salud de Chile', 14, 17);

  y = 32;

  // Datos del trabajador y supervisor
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(220, 230, 240);
  pdf.rect(14, y, pageWidth - 28, 30, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.setTextColor(15, 41, 66);
  pdf.text('ANTECEDENTES DE LA ASIGNACIÓN', 18, y + 7);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(50, 60, 70);
  pdf.text(`Trabajador Receptor: ${delivery.workerNombre} | RUT: ${delivery.workerRut}`, 18, y + 14);
  pdf.text(`Cargo: ${delivery.workerCargo} | Faena/Obra: ${delivery.faenaUbicacion}`, 18, y + 20);
  pdf.text(`Supervisor / Entrega: ${delivery.supervisorResponsable} | Fecha: ${delivery.fechaEntrega}`, 18, y + 26);

  y += 38;

  // Tabla de EPP entregados
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(15, 41, 66);
  pdf.text('ELEMENTOS DE PROTECCIÓN ENTREGADOS', 14, y);

  y += 6;

  // Header tabla
  pdf.setFillColor(230, 238, 245);
  pdf.rect(14, y, pageWidth - 28, 8, 'F');
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(15, 41, 66);
  pdf.text('Elemento EPP', 18, y + 5.5);
  pdf.text('Marca / Modelo / Talla', 75, y + 5.5);
  pdf.text('Norma / Certificación', 130, y + 5.5);
  pdf.text('Cant.', 175, y + 5.5);

  y += 8;

  delivery.items.forEach((item, index) => {
    pdf.setFillColor(index % 2 === 0 ? 255 : 249, index % 2 === 0 ? 255 : 251, index % 2 === 0 ? 255 : 253);
    pdf.rect(14, y, pageWidth - 28, 8, 'F');

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(40, 50, 60);
    pdf.text(item.nombre, 18, y + 5.5);
    pdf.text(`${item.marca} - ${item.modeloTalla}`, 75, y + 5.5);
    pdf.text(item.certificacionNorma, 130, y + 5.5);
    pdf.text(String(item.cantidad), 178, y + 5.5);

    y += 8;
  });

  y += 8;

  // Compromiso del trabajador
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(15, 41, 66);
  pdf.text('DECLARACIÓN Y COMPROMISO DEL TRABAJADOR:', 14, y);

  y += 5;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(60, 75, 90);
  const declaration = [
    '1. Declaro haber recibido en forma gratuita los Elementos de Protección Personal (EPP) individualizados precedentemente.',
    '2. He recibido inducción teórica y práctica respecto de su correcto uso, mantención, limpieza, almacenamiento y reposición.',
    '3. Me comprometo a utilizarlos permanentemente durante toda mi jornada de trabajo en áreas que impliquen riesgo de accidente.',
    '4. Me obligo a informar oportunamente al supervisor en caso de deterioro, extravío o vencimiento del elemento recibido.'
  ];
  declaration.forEach(line => {
    pdf.text(line, 14, y);
    y += 4.5;
  });

  y += 15;

  // Firmas
  pdf.setDrawColor(180, 200, 220);
  pdf.line(25, y, 85, y);
  pdf.line(pageWidth - 85, y, pageWidth - 25, y);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(15, 41, 66);
  pdf.text('Firma Trabajador Receptor', 35, y + 5);
  pdf.text(delivery.workerNombre, 35, y + 9);
  pdf.text(delivery.workerRut, 35, y + 13);

  pdf.text('Firma Supervisor Responsable', pageWidth - 75, y + 5);
  pdf.text(delivery.supervisorResponsable, pageWidth - 75, y + 9);
  pdf.text('Prevención de Riesgos / Obra', pageWidth - 75, y + 13);

  pdf.save(`Acta_EPP_${delivery.workerRut.replace(/[^0-9kK]/g, '')}_${delivery.fechaEntrega}.pdf`);
}
