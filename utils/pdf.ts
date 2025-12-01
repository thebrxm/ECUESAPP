import { jsPDF } from 'jspdf';

export const generatePDF = (data: any) => {
  const doc = new jsPDF();
  const date = new Date().toLocaleDateString('es-ES');
  const time = new Date().toLocaleTimeString('es-ES');

  // Header
  doc.setFillColor(16, 185, 129); // Emerald 500
  doc.rect(0, 0, 210, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORME ECUES', 105, 25, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`${date} - ${time}`, 195, 10, { align: 'right' });

  let y = 50;
  const leftCol = 20;
  const valueCol = 70;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);

  const addLine = (label: string, value: string | number, isHeader = false) => {
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
    
    if (isHeader) {
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(240, 240, 240);
      doc.rect(15, y - 5, 180, 8, 'F');
      doc.text(label, 20, y);
      y += 10;
    } else {
      doc.setFont('helvetica', 'bold');
      doc.text(label, leftCol, y);
      doc.setFont('helvetica', 'normal');
      
      const splitValue = doc.splitTextToSize(String(value), 120);
      doc.text(splitValue, valueCol, y);
      y += (splitValue.length * 6) + 4;
    }
  };

  // METHANE (if exists)
  const methane = data.methane;
  const hasMethane = Object.values(methane).some(v => String(v).trim() !== '');
  
  if (hasMethane) {
    addLine('METHANE', '', true);
    addLine('M (Major Incident):', methane.M || '-');
    addLine('E (Exact Location):', methane.E || '-');
    addLine('T (Type):', methane.T || '-');
    addLine('H (Hazards):', methane.H || '-');
    addLine('A (Access):', methane.A || '-');
    addLine('N (Number):', methane.N || '-');
    addLine('E (Emergency):', methane.E2 || '-');
    y += 5;
  }

  // General Info
  addLine('Detalles del Evento', '', true);
  addLine('Incidente:', data.incidente || 'N/A');
  addLine('Dirección:', data.direccion || 'N/A');
  
  // Totals
  addLine('Resumen de Pacientes', '', true);
  const total = data.counts.atendidos + data.counts.trasladados;
  addLine('Total Pacientes:', `${total} (Final: ${data.isFinal ? 'Sí' : 'No'})`);
  addLine('Óbitos:', data.counts.obitos);
  addLine('Evacuados:', data.counts.evacuados);
  
  // Demographics
  y += 2;
  doc.setFont('helvetica', 'bold');
  doc.text('Desglose:', leftCol, y);
  y += 6;
  
  doc.setFontSize(10);
  const col1 = 30;
  const col2 = 80;
  const col3 = 130;
  
  doc.text(`Masc: ${data.counts.masculino}`, col1, y);
  doc.text(`Fem: ${data.counts.femenino}`, col2, y);
  doc.text(`Sexo S/D: ${data.counts.sexoSD}`, col3, y);
  y += 6;
  doc.text(`Menores: ${data.counts.menores}`, col1, y);
  doc.text(`Mayores: ${data.counts.mayores}`, col2, y);
  doc.text(`Edad S/D: ${data.counts.edadSD}`, col3, y);
  y += 10;
  doc.setFontSize(12);

  // Operations
  addLine('Operativo', '', true);
  addLine('Atendidos en lugar:', data.counts.atendidos);
  addLine('Trasladados:', data.counts.trasladados);
  addLine('Móviles:', data.counts.moviles);
  addLine('Aéreos:', data.counts.aereo);

  // Hospitals
  if (data.hospitals.length > 0 && data.hospitals.some((h: any) => h.count > 0)) {
    addLine('Destinos', '', true);
    data.hospitals.forEach((h: any) => {
      if (h.name && h.count > 0) {
        addLine(h.name + ':', h.count);
      }
    });
  }

  // Text Areas
  if (data.intervencion) {
    addLine('Intervención', '', true);
    addLine('', data.intervencion);
  }
  
  if (data.notas) {
    addLine('Notas', '', true);
    addLine('', data.notas);
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for(let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Página ${i} de ${pageCount} - Generado por App Contador ECUES`, 105, 290, { align: 'center' });
  }

  const filename = `ECUES_${(data.incidente || 'Reporte').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`;
  doc.save(filename);
};