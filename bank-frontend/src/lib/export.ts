/**
 * Export utilities for generating CSV, Excel, and PDF reports
 */

/**
 * Convert array of objects to CSV string
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[]
): void {
  if (data.length === 0) {
    throw new Error("No data to export");
  }

  // Determine columns
  const cols =
    columns ??
    Object.keys(data[0]).map((key) => ({
      key: key as keyof T,
      label: key,
    }));

  // Create CSV header
  const header = cols.map((col) => `"${col.label}"`).join(",");

  // Create CSV rows
  const rows = data.map((row) =>
    cols
      .map((col) => {
        const value = row[col.key];
        // Handle different value types
        if (value === null || value === undefined) return '""';
        if (typeof value === "object") return `"${JSON.stringify(value)}"`;
        // Escape double quotes
        return `"${String(value).replace(/"/g, '""')}"`;
      })
      .join(",")
  );

  // Combine header and rows
  const csv = [header, ...rows].join("\n");

  // Download file
  downloadFile(csv, filename, "text/csv");
}

/**
 * Export table data to Excel format (HTML table that Excel can open)
 */
export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  sheetName: string = "Sheet1",
  columns?: { key: keyof T; label: string }[]
): void {
  if (data.length === 0) {
    throw new Error("No data to export");
  }

  const cols =
    columns ??
    Object.keys(data[0]).map((key) => ({
      key: key as keyof T,
      label: key,
    }));

  // Create HTML table
  const html = `
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          table { border-collapse: collapse; font-family: Arial, sans-serif; }
          th { background-color: #4472C4; color: white; font-weight: bold; padding: 8px; border: 1px solid #ddd; }
          td { padding: 6px; border: 1px solid #ddd; }
          tr:nth-child(even) { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
              ${cols.map((col) => `<th>${col.label}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${data
              .map(
                (row) =>
                  `<tr>${cols
                    .map((col) => {
                      const value = row[col.key];
                      return `<td>${value !== null && value !== undefined ? String(value) : ""}</td>`;
                    })
                    .join("")}</tr>`
              )
              .join("")}
          </tbody>
        </table>
      </body>
    </html>
  `;

  // Download as .xls file (Excel can open HTML tables)
  downloadFile(html, filename.replace(/\.xlsx?$/, "") + ".xls", "application/vnd.ms-excel");
}

/**
 * Generate and download PDF report (simplified - creates a printable HTML page)
 */
export function exportToPDF<T extends Record<string, unknown>>(
  data: T[],
  title: string,
  columns?: { key: keyof T; label: string }[]
): void {
  if (data.length === 0) {
    throw new Error("No data to export");
  }

  const cols =
    columns ??
    Object.keys(data[0]).map((key) => ({
      key: key as keyof T,
      label: key,
    }));

  // Create printable HTML
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
          }
          h1 {
            color: #333;
            border-bottom: 3px solid #4472C4;
            padding-bottom: 10px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            font-size: 11px;
          }
          th {
            background-color: #4472C4;
            color: white;
            font-weight: bold;
            padding: 10px;
            text-align: left;
            border: 1px solid #2d5aa0;
          }
          td {
            padding: 8px;
            border: 1px solid #ddd;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            color: #666;
            font-size: 10px;
          }
          .print-btn {
            margin-bottom: 20px;
            padding: 10px 20px;
            background-color: #4472C4;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
          }
          .print-btn:hover {
            background-color: #2d5aa0;
          }
        </style>
      </head>
      <body>
        <button class="print-btn no-print" onclick="window.print()">Print / Save as PDF</button>
        <h1>${title}</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr>
              ${cols.map((col) => `<th>${col.label}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${data
              .map(
                (row) =>
                  `<tr>${cols
                    .map((col) => {
                      const value = row[col.key];
                      return `<td>${value !== null && value !== undefined ? String(value) : ""}</td>`;
                    })
                    .join("")}</tr>`
              )
              .join("")}
          </tbody>
        </table>
        <div class="footer">
          <p>Total Records: ${data.length}</p>
          <p>Bank Management System - Confidential</p>
        </div>
      </body>
    </html>
  `;

  // Open in new window for printing
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  } else {
    alert("Please allow popups to generate PDF");
  }
}

/**
 * Helper function to trigger file download
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
