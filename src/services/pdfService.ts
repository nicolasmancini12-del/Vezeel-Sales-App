
import { Order } from '../types';

export const generateOrderPDF = (order: Order) => {
  // Accedemos a la librería global cargada en index.html
  // Esto evita que Vite intente buscar 'jspdf' en node_modules y falle
  const jsPDF = (window as any).jspdf ? (window as any).jspdf.jsPDF : (window as any).jsPDF;
  
  if (!jsPDF) {
      alert("Error: La librería PDF no se ha cargado correctamente. Intente recargar la página.");
      return;
  }

  const doc = new jsPDF();
  
  // Colores y Fuentes
  const primaryColor = [37, 99, 235]; // Blue 600
  const grayColor = [100, 116, 139];

  // --- HEADER ---
  doc.setFontSize(22);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("NEXUS ORDER", 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text("Gestión de Servicios y Proyectos", 14, 25);

  // Datos de la Empresa (Derecha)
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(order.company, 200, 20, { align: 'right' });
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text(`Fecha Emisión: ${order.date}`, 200, 25, { align: 'right' });
  doc.text(`Orden #: ${order.id.slice(0, 8).toUpperCase()}`, 200, 30, { align: 'right' });

  // Línea divisoria
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 35, 200, 35);

  // --- CLIENT INFO ---
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text("Información del Cliente", 14, 45);
  
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(`Cliente: ${order.clientName}`, 14, 52);
  doc.text(`Orden de Compra (OC): ${order.poNumber || 'N/A'}`, 14, 58);
  doc.text(`Responsable: ${order.operationsRep || 'Sin Asignar'}`, 14, 64);

  // --- SERVICE DETAILS ---
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text("Detalle del Servicio", 14, 75);

  const tableColumn = ["Concepto", "Detalle", "Unidad", "Cant.", "Precio Unit.", "Total"];
  const tableRows = [
    [
      order.serviceName,
      order.serviceDetails || '-',
      order.unitOfMeasure,
      order.quantity,
      `$${order.unitPrice.toLocaleString()}`,
      `$${order.totalValue.toLocaleString()}`
    ]
  ];

  // AutoTable se adjunta automáticamente a la instancia de jsPDF
  (doc as any).autoTable({
    startY: 80,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: 255 },
    styles: { fontSize: 9, cellPadding: 3 },
  });

  // --- TOTALS ---
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(12);
  doc.text(`Total Neto: $${order.totalValue.toLocaleString()}`, 200, finalY, { align: 'right' });
  
  // --- OBSERVATIONS & FOOTER ---
  if (order.observations) {
      doc.setFontSize(10);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("Observaciones:", 14, finalY + 20);
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(9);
      doc.text(order.observations, 14, finalY + 26, { maxWidth: 180 });
  }

  // Footer text
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("Este documento es un comprobante generado electrónicamente por NexusERP.", 105, 280, { align: 'center' });
  doc.text(`Página 1 de 1`, 200, 280, { align: 'right' });

  // Save
  doc.save(`Orden_${order.id.slice(0,8)}.pdf`);
};
