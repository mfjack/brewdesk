import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export interface TPdfSection {
  title: string;
  headers: string[];
  rows: (string | number)[][];
}

export function buildAndDownloadPdf(filename: string, title: string, subtitle: string, sections: TPdfSection[]) {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text(title, 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(subtitle, 14, 25);

  let cursorY = 32;

  for (const section of sections) {
    if (section.rows.length === 0) {
      continue;
    }

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(section.title, 14, cursorY);

    autoTable(doc, {
      startY: cursorY + 3,
      head: [section.headers],
      body: section.rows.map((row) => row.map(String)),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [40, 40, 40] },
      margin: { left: 14, right: 14 },
    });

    cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    if (cursorY > 270) {
      doc.addPage();
      cursorY = 20;
    }
  }

  doc.save(filename);
}
