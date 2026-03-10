interface EntradaExport {
  nombreInvitado: string;
  dniInvitado: string;
  emailInvitado: string;
  estado: string;
  createdAt: string;
  evento: { nombre: string; fecha: string };
  generadoPor: { nombre: string };
}

export interface LiquidacionExport {
  rrpp: { nombre: string };
  montoPorQr: number;
  totalGeneradas: number;
  totalIngresadas: number;
  montoAPagar: number;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function exportEntradasToExcel(entradas: EntradaExport[], filename: string) {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Entradas");

  sheet.columns = [
    { header: "Invitado", key: "invitado", width: 25 },
    { header: "DNI", key: "dni", width: 15 },
    { header: "Email", key: "email", width: 30 },
    { header: "Evento", key: "evento", width: 25 },
    { header: "RRPP", key: "rrpp", width: 20 },
    { header: "Estado", key: "estado", width: 14 },
    { header: "Fecha", key: "fecha", width: 18 },
  ];

  // Style header row
  sheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1A1A1A" } };
  });

  for (const e of entradas) {
    sheet.addRow({
      invitado: e.nombreInvitado,
      dni: e.dniInvitado,
      email: e.emailInvitado,
      evento: e.evento.nombre,
      rrpp: e.generadoPor.nombre,
      estado: e.estado,
      fecha: new Date(e.createdAt).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" }),
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), filename);
}

export async function exportEntradasToPdf(entradas: EntradaExport[], filename: string) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ orientation: "landscape" });

  doc.setFontSize(16);
  doc.text("Reporte de Entradas", 14, 20);
  doc.setFontSize(10);
  doc.text(`Generado: ${new Date().toLocaleDateString("es-AR")} — Total: ${entradas.length}`, 14, 28);

  autoTable(doc, {
    startY: 34,
    head: [["Invitado", "DNI", "Email", "Evento", "RRPP", "Estado", "Fecha"]],
    body: entradas.map((e) => [
      e.nombreInvitado,
      e.dniInvitado,
      e.emailInvitado,
      e.evento.nombre,
      e.generadoPor.nombre,
      e.estado,
      new Date(e.createdAt).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" }),
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [26, 26, 26] },
  });

  doc.save(filename);
}

export async function exportLiquidacionesToExcel(
  liquidaciones: LiquidacionExport[],
  eventoNombre: string,
  totales: { totalIngresadas: number; montoTotal: number },
  filename: string
) {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Liquidaciones");

  sheet.columns = [
    { header: "RRPP", key: "rrpp", width: 25 },
    { header: "$/QR", key: "montoPorQr", width: 12 },
    { header: "Generadas", key: "generadas", width: 14 },
    { header: "Ingresadas", key: "ingresadas", width: 14 },
    { header: "Monto a pagar", key: "monto", width: 18 },
  ];

  sheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1A1A1A" } };
  });

  for (const l of liquidaciones) {
    sheet.addRow({
      rrpp: l.rrpp.nombre,
      montoPorQr: l.montoPorQr,
      generadas: l.totalGeneradas,
      ingresadas: l.totalIngresadas,
      monto: l.montoAPagar,
    });
  }

  // Totals row
  const totalRow = sheet.addRow({
    rrpp: "TOTAL",
    montoPorQr: "",
    generadas: "",
    ingresadas: totales.totalIngresadas,
    monto: totales.montoTotal,
  });
  totalRow.eachCell((cell) => {
    cell.font = { bold: true };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    filename
  );
}

export async function exportLiquidacionesToPdf(
  liquidaciones: LiquidacionExport[],
  eventoNombre: string,
  totales: { totalIngresadas: number; montoTotal: number },
  filename: string
) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const gold = [197, 160, 89] as [number, number, number];
  const dark = [26, 26, 26] as [number, number, number];

  // Header bar
  doc.setFillColor(...dark);
  doc.rect(0, 0, pageWidth, 35, "F");
  doc.setTextColor(gold[0], gold[1], gold[2]);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("CRUZ", 14, 18);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("ESPACIO", 14, 24);
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(10);
  doc.text("Liquidación de RRPP", pageWidth - 14, 15, { align: "right" });
  doc.setFontSize(8);
  doc.text(`Fecha: ${new Date().toLocaleDateString("es-AR")}`, pageWidth - 14, 22, { align: "right" });

  // Event info
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(eventoNombre, 14, 50);
  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.setLineWidth(0.5);
  doc.line(14, 54, pageWidth - 14, 54);

  // Summary boxes
  const boxY = 60;
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(14, boxY, 85, 22, 3, 3, "F");
  doc.roundedRect(pageWidth / 2 + 5, boxY, 85, 22, 3, 3, "F");
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(gold[0], gold[1], gold[2]);
  doc.text(`$${totales.montoTotal.toLocaleString("es-AR")}`, 56.5, boxY + 13, { align: "center" });
  doc.setTextColor(40, 40, 40);
  doc.text(`${totales.totalIngresadas}`, pageWidth / 2 + 47.5, boxY + 13, { align: "center" });
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text("Total a pagar", 56.5, boxY + 19, { align: "center" });
  doc.text("QRs ingresados", pageWidth / 2 + 47.5, boxY + 19, { align: "center" });

  // Table
  autoTable(doc, {
    startY: boxY + 30,
    head: [["RRPP", "$/QR", "Generadas", "Ingresadas", "Monto a pagar"]],
    body: [
      ...liquidaciones.map((l) => [
        l.rrpp.nombre,
        `$${l.montoPorQr.toLocaleString("es-AR")}`,
        l.totalGeneradas.toString(),
        l.totalIngresadas.toString(),
        `$${l.montoAPagar.toLocaleString("es-AR")}`,
      ]),
    ],
    foot: [["TOTAL", "", "", totales.totalIngresadas.toString(), `$${totales.montoTotal.toLocaleString("es-AR")}`]],
    styles: { fontSize: 9, cellPadding: 5 },
    headStyles: { fillColor: dark, textColor: [255, 255, 255], fontStyle: "bold" },
    footStyles: { fillColor: [245, 245, 245], textColor: dark, fontStyle: "bold", fontSize: 10 },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right", fontStyle: "bold" },
    },
  });

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setDrawColor(220, 220, 220);
  doc.line(14, footerY - 5, pageWidth - 14, footerY - 5);
  doc.setFontSize(7);
  doc.setTextColor(160, 160, 160);
  doc.text("CRUZ Espacio — Sistema de Gestión", 14, footerY);
  doc.text("Documento generado automáticamente", pageWidth - 14, footerY, { align: "right" });

  doc.save(filename);
}

/** Generate a per-RRPP detail PDF (invoice-style receipt) */
export async function exportRrppDetailPdf(
  rrppName: string,
  rrppEmail: string,
  eventoNombre: string,
  eventoFecha: string,
  montoPorQr: number,
  totalGeneradas: number,
  totalIngresadas: number,
  montoAPagar: number,
  filename: string
) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const gold = [197, 160, 89] as [number, number, number];
  const dark = [26, 26, 26] as [number, number, number];

  // Header
  doc.setFillColor(...dark);
  doc.rect(0, 0, pageWidth, 35, "F");
  doc.setTextColor(gold[0], gold[1], gold[2]);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("CRUZ", 14, 18);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("ESPACIO", 14, 24);
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(10);
  doc.text("Recibo de Liquidación", pageWidth - 14, 15, { align: "right" });
  doc.setFontSize(8);
  doc.text(`Fecha: ${new Date().toLocaleDateString("es-AR")}`, pageWidth - 14, 22, { align: "right" });

  // RRPP info
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Destinatario", 14, 48);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(rrppName, 14, 56);
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(rrppEmail, 14, 62);

  // Evento info
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Evento", pageWidth / 2, 48);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(eventoNombre, pageWidth / 2, 56);
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(eventoFecha, pageWidth / 2, 62);

  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.setLineWidth(0.5);
  doc.line(14, 68, pageWidth - 14, 68);

  // Detail table
  autoTable(doc, {
    startY: 75,
    head: [["Concepto", "Detalle"]],
    body: [
      ["Monto por QR", `$${montoPorQr.toLocaleString("es-AR")}`],
      ["Entradas generadas", totalGeneradas.toString()],
      ["Entradas ingresadas", totalIngresadas.toString()],
    ],
    styles: { fontSize: 10, cellPadding: 6 },
    headStyles: { fillColor: dark, textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    columnStyles: { 1: { halign: "right", fontStyle: "bold" } },
  });

  // Total box
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable?.finalY || 120;
  doc.setFillColor(gold[0], gold[1], gold[2]);
  doc.roundedRect(pageWidth / 2 - 10, finalY + 10, pageWidth / 2 - 4, 25, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("TOTAL A PAGAR", pageWidth / 2 + 5, finalY + 21);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(`$${montoAPagar.toLocaleString("es-AR")}`, pageWidth - 18, finalY + 28, { align: "right" });

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setDrawColor(220, 220, 220);
  doc.line(14, footerY - 5, pageWidth - 14, footerY - 5);
  doc.setFontSize(7);
  doc.setTextColor(160, 160, 160);
  doc.text("CRUZ Espacio — Sistema de Gestión", 14, footerY);
  doc.text("Documento generado automáticamente", pageWidth - 14, footerY, { align: "right" });

  doc.save(filename);
}
