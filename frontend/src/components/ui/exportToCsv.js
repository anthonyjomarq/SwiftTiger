export function exportToCsv(filename, columns, data) {
  const headers = columns.map((col) => col.Header);
  const accessors = columns.map((col) => col.accessor);
  const csvRows = [headers.join(",")];

  for (const row of data) {
    const values = accessors.map((key) => {
      let value = row[key];
      if (typeof value === "string") {
        value = value.replace(/"/g, '""');
        if (value.includes(",") || value.includes("\n")) {
          value = `"${value}"`;
        }
      }
      return value;
    });
    csvRows.push(values.join(","));
  }

  const csvContent = csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
