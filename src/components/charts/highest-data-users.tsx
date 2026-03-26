"use client";

import { Server } from "lucide-react";

interface Device {
  uuid: string;
  serial_no: string;
  label?: string;
  used_data: number;
}

interface TopDataUser {
  uuid: string;
  label: string;
  serialNo: string;
  usedData: number;
}

interface HighestDataUsersProps {
  devices?: Device[];
  topUsers?: TopDataUser[];
}

export function HighestDataUsers({ devices, topUsers: precomputedTopUsers }: HighestDataUsersProps) {
  // Use precomputed top users if available, otherwise compute from devices
  const topUsers = precomputedTopUsers
    ? precomputedTopUsers.map((u) => ({
        uuid: u.uuid,
        serial_no: u.serialNo,
        label: u.label,
        used_data: u.usedData,
      }))
    : devices
      ? [...devices].sort((a, b) => b.used_data - a.used_data).slice(0, 5)
      : [];

  const formatDataUsage = (bytes: number): string => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  };

  if (topUsers.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p className="text-sm">No devices found</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {topUsers.map((device) => (
        <div key={device.uuid} className="flex items-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
            <Server className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="ml-4 space-y-1 flex-1">
            <p className="text-sm font-medium leading-none">
              {device.label || device.serial_no}
            </p>
            <p className="text-sm text-muted-foreground">
              {device.serial_no}
            </p>
          </div>
          <div className="ml-auto font-medium">
            {formatDataUsage(device.used_data)}
          </div>
        </div>
      ))}
    </div>
  );
}
