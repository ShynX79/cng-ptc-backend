// src/export/export.service.ts

import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ExportService {
    constructor(private readonly supabaseService: SupabaseService) { }

    async generateReadingsReport(token: string, startDate: string, endDate: string): Promise<Buffer> {
        // 1. Ambil data mentah langsung dari Supabase RPC
        const supabase = this.supabaseService.getClient(token);
        const { data: rawReadings, error } = await supabase.rpc('get_readings_with_flowmeter', {
            customer_filter: 'all',
            operator_filter: 'all',
            search_term: '',
            sort_order: 'asc',
        })
            .gte('recorded_at', startDate)
            .lte('recorded_at', `${endDate} 23:59:59`);

        if (error) {
            throw new InternalServerErrorException('Gagal mengambil data readings dari database.');
        }
        if (!rawReadings || rawReadings.length === 0) {
            throw new NotFoundException('Tidak ada data untuk diekspor pada rentang tanggal ini.');
        }

        // 2. Load the template file
        const templatePath = path.join(process.cwd(), 'templates', 'template-laporan.xlsm');
        let workbook: XLSX.WorkBook;
        try {
            const templateFile = fs.readFileSync(templatePath);
            workbook = XLSX.read(templateFile, { type: 'buffer' });
        } catch (err) {
            throw new InternalServerErrorException('Gagal memuat file template. Pastikan file ada di folder /templates.');
        }

        const templateSheetName = 'sheet1';
        const templateWorksheet = workbook.Sheets[templateSheetName];
        if (!templateWorksheet) {
            throw new InternalServerErrorException(`Sheet '${templateSheetName}' tidak ditemukan di dalam template.`);
        }

        // 3. Group data by customer
        const customerDataMap = new Map<string, any[]>();
        rawReadings.forEach(row => {
            const customerCode = row.customer_code;
            let customerArray = customerDataMap.get(customerCode);
            if (!customerArray) {
                customerArray = [];
                customerDataMap.set(customerCode, customerArray);
            }
            customerArray.push(row);
        });

        // 4. Create a new sheet for each customer
        customerDataMap.forEach((customerData, customerCode) => {
            const newSheet = JSON.parse(JSON.stringify(templateWorksheet));
            const customerName = customerData[0]?.profiles?.username || customerCode;

            newSheet['I5'] = { t: 's', v: `PT. ${customerName}` };
            newSheet['E3'] = { t: 's', v: `PT. ${customerName}` };

            // [PERBAIKAN] Sesuaikan pemetaan data dengan kolom di template
            const dataForSheet = customerData.map(row => {
                const d = new Date(row.recorded_at);
                const flowMeterValue = row.flowMeter === "" || isNaN(Number(row.flowMeter)) ? null : Number(row.flowMeter);
                return {
                    // Kolom E: Jmlh Fix Storage
                    E: Number(row.fixed_storage_quantity),
                    // Kolom F: Storage
                    F: Number(row.storage_number),
                    // Kolom G: Date
                    G: d,
                    // Kolom H: Jam
                    H: d,
                    // Kolom I: Pressure
                    I: Number(row.psi),
                    // Kolom J: Temp
                    J: Number(row.temp),
                    // Kolom K: Pressure Out
                    K: Number(row.psi_out),
                    // Kolom L: Flow / Turbin
                    L: Number(row.flow_turbine),
                    // Kolom M: FLOW PERJAM (Flowmeter)
                    M: flowMeterValue,
                    // Kolom Q: Remarks
                    Q: row.remarks,
                };
            });

            XLSX.utils.sheet_add_json(newSheet, dataForSheet, {
                origin: 'E10', // Mulai dari kolom E, baris 10
                header: ["E", "F", "G", "H", "I", "J", "K", "L", "M", "Q"],
                skipHeader: true,
            });

            customerData.forEach((row, index) => {
                const rowIndex = 10 + index;

                const dateCell = newSheet[`G${rowIndex}`];
                if (dateCell) dateCell.z = 'dd/mm/yyyy';

                const timeCell = newSheet[`H${rowIndex}`];
                if (timeCell) timeCell.z = 'hh:mm';

                newSheet[`O${rowIndex}`] = { t: 'n', f: `IFERROR(IF(OR(E${rowIndex}=$A$6,E${rowIndex}=$A$5),N${rowIndex - 1}-N${rowIndex},IF(N${rowIndex}="","",IF(N${rowIndex - 1}="","",N${rowIndex - 1}-N${rowIndex}))),"-")` };
                newSheet[`P${rowIndex}`] = { t: 'n', f: `IFERROR(M${rowIndex}/O${rowIndex},"")`, z: '0%' };
            });

            XLSX.utils.book_append_sheet(workbook, newSheet, customerName.substring(0, 31));
        });

        // 5. Remove the original template sheet and write the final buffer
        delete workbook.Sheets[templateSheetName];
        workbook.SheetNames = workbook.SheetNames.filter(name => name !== templateSheetName);

        const outputBuffer = XLSX.write(workbook, { bookType: 'xlsm', type: 'buffer' });
        return outputBuffer;
    }
}
