export interface SpeedTestResult {
  id: number;
  str_type: number;
  str_serveraddress: string | null;
  str_serverport: number;
  dev_id: number;
  dev_port: number;
  company_id: number;
  str_time: number;
  str_result: number;
  str_text: string;
  created_at: string;
  carrier?: string;
  download_speed?: string | null;
  upload_speed?: string | null;
  pcc_band?: string;
  pcc_strength?: string;
  scc_band_info?: Array<{
    band: string;
    strength: string;
  }>;
  LATENCY?: number;
  JITTER?: number;
  RAT?: string;
  PLMN?: string;
  TAC_LAC?: string;
  CELLID?: string;
  SIGNAL?: string;
  BAND?: string;
  DL_BW?: string;
  PCID?: string;
  ENDC_PCID?: string;
  ENDC_SIGNAL?: string;
  ENDC_BAND?: string;
  ENDC_DL_BW?: string;
  CA_INFO?: string;
}
