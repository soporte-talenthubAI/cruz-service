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

  doc.setFontSize(16);
  doc.text("Liquidaciones", 14, 20);
  doc.setFontSize(10);
  doc.text(`Evento: ${eventoNombre}`, 14, 28);
  doc.text(`Generado: ${new Date().toLocaleDateString("es-AR")}`, 14, 34);

  autoTable(doc, {
    startY: 40,
    head: [["RRPP", "$/QR", "Generadas", "Ingresadas", "Monto a pagar"]],
    body: [
      ...liquidaciones.map((l) => [
        l.rrpp.nombre,
        `$${l.montoPorQr}`,
        l.totalGeneradas,
        l.totalIngresadas,
        `$${l.montoAPagar.toLocaleString("es-AR")}`,
      ]),
      ["TOTAL", "", "", totales.totalIngresadas, `$${totales.montoTotal.toLocaleString("es-AR")}`],
    ],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [26, 26, 26] },
  });

  doc.save(filename);
}
