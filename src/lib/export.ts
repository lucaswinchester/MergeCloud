// Device export utilities for CSV and Excel

interface ExportDevice {
  uuid: string;
  serial_no: string;
  label?: string;
  port_group?: string;
  is_activated: boolean;
  status_formatted?: string;
  used_data_formatted?: number;
  device_type?: string;
  device_plan?: string;
}

// Convert devices to CSV format
export function devicesToCSV(devices: ExportDevice[]): string {
  const headers = [
    "Serial Number",
    "Label",
    "Port Group",
    "Activated",
    "Status",
    "Used Data (GB)",
    "Device Type",
    "Device Plan",
    "UUID",
  ];

  const rows = devices.map((device) => {
    const usedDataGB = device.used_data_formatted
      ? (device.used_data_formatted / 1024).toFixed(2)
      : "0";

    return [
      escapeCSV(device.serial_no),
      escapeCSV(device.label || ""),
      escapeCSV(device.port_group?.replace(/^SpQ\s*:\s*/, "") || ""),
      device.is_activated ? "Yes" : "No",
      escapeCSV(device.status_formatted || "Unknown"),
      usedDataGB,
      escapeCSV(device.device_type || ""),
      escapeCSV(device.device_plan || ""),
      device.uuid,
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

// Escape special characters for CSV
function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// Download file in browser
export function downloadFile(content: string, filename: string, mimeType: string) {
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

// Export devices to CSV and trigger download
export function exportDevicesToCSV(devices: ExportDevice[], filename?: string) {
  const csv = devicesToCSV(devices);
  const timestamp = new Date().toISOString().split("T")[0];
  const finalFilename = filename || `devices-export-${timestamp}.csv`;
  downloadFile(csv, finalFilename, "text/csv;charset=utf-8;");
}

// Export devices to Excel (XLSX) format
// Note: This creates a simple CSV that Excel can open. For true XLSX support,
// consider adding the xlsx library in the future.
export function exportDevicesToExcel(devices: ExportDevice[], filename?: string) {
  const csv = devicesToCSV(devices);
  const timestamp = new Date().toISOString().split("T")[0];
  const finalFilename = filename || `devices-export-${timestamp}.xlsx`;
  // Using CSV format with xlsx extension - Excel will handle it
  downloadFile(csv, finalFilename, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
}

// Get current date formatted for filenames
export function getExportFilename(prefix: string, extension: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return `${prefix}-${timestamp}.${extension}`;
}
