import type { Response } from "express";
import * as XLSX from "xlsx";

interface Column {
  header: string;
  key: string;
  transform?: (val: unknown) => string;
}

export function sendCsv(
  res: Response,
  filename: string,
  columns: Column[],
  rows: Record<string, unknown>[]
) {
  const headers = columns.map((c) => c.header);
  const csvRows = [headers.join(",")];

  for (const row of rows) {
    const values = columns.map((col) => {
      const raw = row[col.key];
      const val = col.transform ? col.transform(raw) : String(raw ?? "");
      // Escape CSV: wrap in quotes if contains comma, quote, or newline
      if (val.includes(",") || val.includes('"') || val.includes("\n")) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    });
    csvRows.push(values.join(","));
  }

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(csvRows.join("\n"));
}

export function sendXlsx(
  res: Response,
  filename: string,
  sheetName: string,
  columns: Column[],
  rows: Record<string, unknown>[]
) {
  const data = rows.map((row) => {
    const obj: Record<string, string> = {};
    for (const col of columns) {
      const raw = row[col.key];
      obj[col.header] = col.transform ? col.transform(raw) : String(raw ?? "");
    }
    return obj;
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  // Auto-width columns
  const colWidths = columns.map((col) => {
    const maxLen = Math.max(
      col.header.length,
      ...rows.map((r) => {
        const raw = r[col.key];
        const val = col.transform ? col.transform(raw) : String(raw ?? "");
        return val.length;
      })
    );
    return { wch: Math.min(maxLen + 2, 40) };
  });
  ws["!cols"] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(Buffer.from(buf));
}
