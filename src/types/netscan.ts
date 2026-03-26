export interface NetScanResult {
  id: number;
  dev_id: number;
  dev_port: number;
  company_id: number;
  nsr_time: number;
  nsr_text: string;
  nsr_result: number;
  created_at: string;
  nsr_json?: Array<{
    ref_op: string;
    rat: string;
    band: string;
    signal: string;
    op_name: string;
  }>;
  best_result?: {
    refop: string;
    rat: string;
    band: string;
    signal: string;
    operator_name: string;
  };
}

export interface NetScanResponse {
  start: number;
  count: number;
  total: number;
  cells: NetScanResult[];
}
