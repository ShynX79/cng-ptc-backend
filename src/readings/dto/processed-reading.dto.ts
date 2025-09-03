// Tipe data mentah dari database yang dibutuhkan untuk proses
export interface RawReading {
    created_at: string | number | Date;
    id: number;
    customer_code: string;
    storage_number: string;
    operation_type: 'manual' | 'dumping' | 'stop' | string;
    flow_turbine: number | string;
    recorded_at: string;
    fixed_storage_quantity?: number;
    psi?: number;
    temp?: number;
    psi_out?: number;
    remarks?: string;
}

// Data setelah ditambah properti flowMeter
export interface ReadingWithFlowMeter extends RawReading {
    flowMeter: number | string;
}

// Baris kuning "CHANGE"
export interface ChangeRow {
    id: string;
    isChangeRow: true;
    totalFlow: number;
    duration: string;
    customer_code: string;
    recorded_at: string;
}

// Baris merah "STOP"
export interface StopRow {
    id: string;
    isStopRow: true;
    totalFlow: number;
    duration: string;
    customer_code: string;
    recorded_at: string;
}

// Baris biru "TOTAL" sebelum blok dumping
export interface DumpingTotalRow {
    id: string;
    isDumpingTotalRow: true;
    totalFlow: number;
    duration: string; // Waktu selesai
    customer_code: string;
    recorded_at: string;
    storage_number: string;
}

// Baris biru ringkasan durasi dumping
export interface DumpingSummaryRow {
    id: string;
    isDumpingSummary: true;
    totalFlow: number; // Selalu 0
    duration: string; // Format HH:mm
    customer_code: string;
    recorded_at: string;
}

// Tipe gabungan untuk semua kemungkinan baris yang akan dikirim ke frontend
export type ProcessedRow =
    | ReadingWithFlowMeter
    | ChangeRow
    | StopRow
    | DumpingTotalRow
    | DumpingSummaryRow;

