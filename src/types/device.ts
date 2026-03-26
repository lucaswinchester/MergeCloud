// Port Forwarding
export interface PortForwardRule {
  id: number;
  rule_name: string;
  protocol: string;
  external_port: number;
  internal_ip: string;
  internal_port: number;
  enabled: boolean;
}

export interface PortForwardRuleCreate {
  rule_name: string;
  protocol: "TCP" | "UDP" | "BOTH";
  external_port: number;
  internal_ip: string;
  internal_port: number;
}

export interface AvailableIP {
  ip: string;
  ip_type: string;
}

// Dedicated IP
export interface DedicatedIPRule {
  id: number;
  dedicated_ip: string;
  internal_ip: string;
  status: string;
}

export interface DedicatedIPCreate {
  internal_ip: string;
}

// Bridged IP
export interface BridgedIPRule {
  id: number;
  bridged_ip: string;
  internal_ip: string;
  status: string;
}

export interface BridgedIPCreate {
  internal_ip: string;
}

// Config Backup
export interface ConfigBackup {
  id: number;
  name: string;
  created_at: string;
}

// Device Config
export interface DeviceConfig {
  ssid?: string;
  password?: string;
  logo_file?: string;
  [key: string]: unknown;
}

export interface SetLanIPRequest {
  lan_ip: string;
}

// Device Monitoring
export interface ConnectedDevice {
  ip: string;
  mac: string;
  hostname: string;
}

export interface ServingCellRecord {
  id: number;
  time: number;
  operator: string;
  cell_id: string;
  rat: string;
  band: string;
  signal: number;
}

export interface SimActivity {
  id: number;
  action: string;
  timestamp: string;
}

export interface UptimeMetrics {
  uptime: number;
  uptime_formatted: string;
  last_restart: string;
}

// Reporting
export interface ActionReport {
  id: number;
  action: string;
  device_uuid: string;
  timestamp: string;
  [key: string]: unknown;
}

export interface IPReport {
  id: number;
  ip: string;
  device_uuid: string;
  start_date: string;
  end_date: string;
  [key: string]: unknown;
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

// Shared prop interface for device tab components
export interface DeviceInfo {
  device: {
    id: number;
    name: string;
    id_master: number;
    portgroups: string;
    serial: string;
    status: number;
    useddata: number;
    app_version: string;
    status_formatted: string;
    gps: string;
    ip: string;
    sshport: string;
    id_manager: number;
    manager_ip: string;
    label: string;
    device_type: string;
    dev_m1iccid: string;
    m1_info: Record<string, unknown>;
    deviceplan: string;
    pass_status: number;
    pass_status_formatted: string;
    package: string;
    updatestatus: number;
    changes_pending: boolean;
    sleeping: number;
    admin_link: string;
    dev_package_updated_date: string;
    updatepackage: string;
  };
  port: {
    id: number;
    id_card: number;
    id_device: number;
    status: number;
    status_formatted: string;
    id_portgroup: string;
    currentplmn: string;
    spt_operator: number;
    spt_signal: number;
    spt_band: number;
    spt_bandwidth: number;
    spt_lac: number;
    spt_cellid: number;
    spt_ca_info: string;
    id_arule: number;
    is_manual_allocation: boolean;
    sim_provider: string;
    sim_iccid: string;
    cell_latitude: number;
    cell_longitude: number;
  };
  latest_speed_test_result?: {
    id: number;
    str_type: number;
    str_serveraddress: string;
    str_serverport: number;
    dev_id: number;
    dev_port: number;
    company_id: number;
    str_time: number;
    str_result: number;
    str_text: string;
  };
  latest_net_scan_result?: {
    id: number;
    dev_id: number;
    dev_port: number;
    company_id: number;
    nsr_time: number;
    nsr_text: string;
    nsr_result: number;
  };
  db_info: {
    created_at: string;
    last_updated_at: string;
    uuid: string;
    serial_no: string;
    name: string;
    device_ping_id: string;
    port_group: string;
    is_activated: boolean;
    status: number;
    status_formatted: string;
    used_data: number;
    app_version: string;
    used_data_formatted: number;
    reseller_name: string;
    parent_reseller_name: string;
    reseller_id: number;
    reseller_uuid: string;
    child_reseller_name: string;
    label: string;
    device_type: string;
    mac_address: string;
    device_plan: string;
    scheduled_restart_frequency: string;
    scheduled_restart_time: string;
    scheduled_restart_day: number;
  };
  cell_info?: {
    sci_id: string;
    dev_id: number;
    dev_port: number;
    imsi: string;
    company_id: number;
    sci_time: number;
    sci_operator: number;
    sci_lac: number;
    sci_cellid: string;
    sci_rat: number;
    sci_band: number;
    sci_bandwidth: number;
    sci_pcid: number;
    sci_endc_active: number;
    sci_endc_pcid: number;
    sci_endc_signal: number;
    sci_endc_band: number;
    sci_endc_bandwidth: number;
    sci_ca_info: string;
    sci_signal: number;
    created_at: string;
    last_updated: string;
    id: number;
  };
}

export interface SparqfiPermissions {
  canActivate?: boolean;
  canDeactivate?: boolean;
  canUpdateFirmware?: boolean;
  canPortForward?: boolean;
  canDedicatedIp?: boolean;
  canBridgedIp?: boolean;
  canConfigBackup?: boolean;
  canViewReports?: boolean;
  [key: string]: boolean | undefined;
}

export interface DeviceTabProps {
  device: DeviceInfo;
  uuid: string;
  serial: string;
  onDeviceUpdate: (updater: (prev: DeviceInfo | null) => DeviceInfo | null) => void;
  actionLoading: boolean;
  setActionLoading: (v: boolean) => void;
  triggerBoostMode: () => void;
  sparqfiPermissions?: SparqfiPermissions;
}
