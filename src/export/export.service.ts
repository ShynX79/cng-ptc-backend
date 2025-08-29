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
        const supabase = this.supabaseService.getClient(token);
        const { data: rawReadings, error } = await supabase.rpc('get_readings_with_flowmeter', {
            customer_filter: 'all',
            operator_filter: 'all',
            search_term: '',
            sort_order: 'asc',
            start_date_filter: startDate,
            end_date_filter: `${endDate} 23:59:59`
        });

        if (error) {
            console.error('Supabase RPC error:', error);
            throw new InternalServerErrorException('Gagal mengambil data readings dari database.');
        }

        if (!rawReadings || rawReadings.length === 0) {
            throw new NotFoundException('Tidak ada data untuk diekspor pada rentang tanggal ini.');
        }

        const templatePath = path.join(process.cwd(), 'templates', 'template-laporan.xlsm');
        let workbook: XLSX.WorkBook;
        try {
            const templateFile = fs.readFileSync(templatePath);
            workbook = XLSX.read(templateFile, { type: 'buffer' });
        } catch (err) {
            console.error('Template file error:', err);
            throw new InternalServerErrorException('Gagal memuat file template. Pastikan file ada di folder /templates.');
        }

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

        const templateSheetName = 'sheet1';

        customerDataMap.forEach((customerData, customerCode) => {
            const templateWorksheet = workbook.Sheets[templateSheetName];
            if (!templateWorksheet) {
                throw new InternalServerErrorException(`Sheet '${templateSheetName}' tidak ditemukan di template.`);
            }

            const newSheet = JSON.parse(JSON.stringify(templateWorksheet));

            // Menggunakan `customer_name` dari RPC, bukan username operator
            const customerName = customerData[0]?.customer_name || customerCode;

            newSheet['I5'] = { t: 's', v: `PT. ${customerName}` };
            newSheet['E3'] = { t: 's', v: `PT. ${customerName}` };

            newSheet["!merges"] = [
                { s: { r: 4, c: 8 }, e: { r: 5, c: 10 } },
            ];

            const dataForSheet = customerData.map(row => {
                const d = new Date(row.recorded_at);
                const storageAsNumber = isNaN(parseInt(row.storage_number))
                    ? row.storage_number
                    : parseInt(row.storage_number);
                return {
                    E: Number(row.fixed_storage_quantity),
                    F: storageAsNumber,
                    G: d,
                    H: d,
                    I: Number(row.psi),
                    J: Number(row.temp),
                    K: Number(row.psi_out),
                    L: Number(row.flow_turbine),
                    Q: row.remarks,
                };
            });

            XLSX.utils.sheet_add_json(newSheet, dataForSheet, {
                origin: 'A10',
                header: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q"],
                skipHeader: true,
            });

            customerData.forEach((row, index) => {
                const currentRow = 10 + index;
                const formula = `=IFERROR(IF(OR(E${currentRow}=$A$6,E${currentRow}=$A$5),N${currentRow - 1}-N${currentRow},IF(N${currentRow}="","",IF(N${currentRow - 1}="","",N${currentRow - 1}-N${currentRow}))),"-")`;
                newSheet[`O${currentRow}`] = { t: 'n', f: formula };

                const dateCell = newSheet[`G${currentRow}`];
                if (dateCell) dateCell.z = 'dd/mm/yyyy';

                const timeCell = newSheet[`H${currentRow}`];
                if (timeCell) timeCell.z = 'hh:mm';
            });

            XLSX.utils.book_append_sheet(workbook, newSheet, customerName.substring(0, 31));
        });

        delete workbook.Sheets[templateSheetName];
        workbook.SheetNames = workbook.SheetNames.filter(name => name !== templateSheetName);

        const outputBuffer = XLSX.write(workbook, { bookType: 'xlsm', type: 'buffer' });
        return outputBuffer;
    }
}