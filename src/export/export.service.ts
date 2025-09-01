// src/export/export.service.ts

import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
// FIX: Menggunakan 'xlsx-js-style' untuk dukungan format
import * as XLSX from 'xlsx-js-style';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ExportService {
    constructor(private readonly supabaseService: SupabaseService) { }

    async generateReadingsReport(token: string, startDate: string, endDate: string): Promise<Buffer> {
        const supabase = this.supabaseService.getClient(token);

        const { data: rawReadings, error } = await supabase.rpc('get_readings_with_flowmeter', {
            customer_filter: 'all',
            operator_filter: 'all',
            search_term: '',
            sort_order: 'asc'
        });

        if (error) {
            console.error('Supabase RPC error:', error);
            throw new InternalServerErrorException('Gagal mengambil data readings dari database.');
        }

        const filteredReadings = rawReadings.filter(reading => {
            const readingDate = new Date(reading.recorded_at);
            return readingDate >= new Date(startDate) && readingDate <= new Date(`${endDate} 23:59:59`);
        });

        if (!filteredReadings || filteredReadings.length === 0) {
            throw new NotFoundException('Tidak ada data untuk diekspor pada rentang tanggal ini.');
        }

        const templatePath = path.join(process.cwd(), 'templates', 'template-laporan.xlsx');

        const workbook = XLSX.read(fs.readFileSync(templatePath), { type: 'buffer', cellStyles: true });

        const customerDataMap = new Map<string, any[]>();
        filteredReadings.forEach(row => {
            const customerCode = row.customer_code;
            let customerArray = customerDataMap.get(customerCode);
            if (!customerArray) {
                customerArray = [];
                customerDataMap.set(customerCode, customerArray);
            }
            customerArray.push(row);
        });

        const templateSheetName = 'Laporan';

        customerDataMap.forEach((customerData, customerCode) => {
            const templateWorksheet = workbook.Sheets[templateSheetName];
            if (!templateWorksheet) {
                throw new InternalServerErrorException(`Sheet '${templateSheetName}' tidak ditemukan di template.`);
            }

            const newSheet = JSON.parse(JSON.stringify(templateWorksheet));
            const customerName = customerData[0]?.customer_name || customerCode;

            const titleCellAddress = 'H3';
            if (newSheet[titleCellAddress]) {
                newSheet[titleCellAddress].v = `PT. ${customerName}`;
            } else {
                newSheet[titleCellAddress] = { t: 's', v: `PT. ${customerName}` };
            }

            const startRow = 9;

            const borderStyle = {
                border: {
                    top: { style: 'thin', color: { rgb: '000000' } },
                    bottom: { style: 'thin', color: { rgb: '000000' } },
                    left: { style: 'thin', color: { rgb: '000000' } },
                    right: { style: 'thin', color: { rgb: '000000' } }
                }
            };

            customerData.forEach((row, index) => {
                const currentRow = startRow + index;

                const dataMapping = {
                    D: Number(row.fixed_storage_quantity),
                    E: row.storage_number,
                    F: new Date(row.recorded_at), // Date
                    G: new Date(row.recorded_at), // Jam
                    H: Number(row.psi),
                    I: Number(row.temp),
                    J: Number(row.psi_out),
                    K: Number(row.flow_turbine),
                    L: Number(row.flowMeter),
                    N: 0,
                    Q: row.remarks,
                };

                for (const colLetter in dataMapping) {
                    const cellAddress = `${colLetter}${currentRow}`;
                    const value = dataMapping[colLetter];

                    const newCell = {
                        v: value,
                        s: borderStyle
                    };

                    if (typeof value === 'number') {
                        newCell['t'] = 'n';
                    } else if (value instanceof Date) {
                        newCell['t'] = 'd';
                        if (colLetter === 'F') newCell['z'] = 'dd/mm/yyyy';
                        if (colLetter === 'G') newCell['z'] = 'hh:mm';
                    } else {
                        newCell['t'] = 's';
                    }

                    newSheet[cellAddress] = newCell;
                }

                // --- FIX: Memperbaiki logika penulisan formula ---
                const formulaCellAddress = `O${currentRow}`;

                // Untuk baris data pertama (index === 0), tidak ada data sebelumnya untuk dihitung selisihnya.
                // Kita bisa isi dengan 0 atau strip.
                if (index === 0) {
                    newSheet[formulaCellAddress] = { t: 'n', v: 0, s: borderStyle };
                } else {
                    // Untuk baris selanjutnya, baru kita hitung selisih dengan baris sebelumnya.
                    const formula = `L${currentRow}-L${currentRow - 1}`;
                    newSheet[formulaCellAddress] = { t: 'n', f: formula, s: borderStyle };
                }
            });

            XLSX.utils.book_append_sheet(workbook, newSheet, customerName.substring(0, 31));
        });

        delete workbook.Sheets[templateSheetName];
        workbook.SheetNames = workbook.SheetNames.filter(name => name !== templateSheetName);

        const outputBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
        return outputBuffer;
    }
}

