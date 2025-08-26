import {
    Injectable,
    InternalServerErrorException,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateReadingDto } from './dto/create-reading.dto';
import { UpdateReadingDto } from './dto/update-reading.dto';
import { PerformDumpingDto } from './dto/perform-dumping.dto';

type AnyRow = Record<string, any>;

@Injectable()
export class ReadingsService {
    constructor(private readonly supabaseService: SupabaseService) { }

    private get supabase() {
        return this.supabaseService.getAdminClient();
    }

    async performDumping(targetReadingId: number, dumpingDto: PerformDumpingDto, user: any) {
        // 1. Temukan data pembacaan target (yang akan diisi ulang)
        const { data: targetReading, error: findError } = await this.supabase
            .from('readings')
            .select('*')
            .eq('id', targetReadingId)
            .single();

        if (findError || !targetReading) {
            throw new NotFoundException(`Target reading with ID ${targetReadingId} not found.`);
        }

        // 2. Hitung PSI yang ditransfer dari tangki sumber
        const psiToAdd = dumpingDto.startPsi - dumpingDto.endPsi;

        // 3. Hitung PSI baru untuk tangki tujuan
        const newTargetPsi = targetReading.psi + psiToAdd;

        // 4. Siapkan TIGA data baru yang akan dimasukkan ke database

        // Catatan untuk awal proses dumping dari tangki sumber
        const startDumpingReading: AnyRow = {
            customer_code: targetReading.customer_code,
            storage_number: dumpingDto.dumpingStorageNumber,
            operator_id: user.id,
            psi: dumpingDto.startPsi,
            temp: targetReading.temp,
            psi_out: targetReading.psi_out,
            flow_turbine: targetReading.flow_turbine,
            recorded_at: targetReading.recorded_at,
            remarks: 'dumping start',
        };

        // Catatan untuk akhir proses dumping dari tangki sumber
        const endDumpingReading: AnyRow = {
            ...startDumpingReading,
            psi: dumpingDto.endPsi,
            recorded_at: dumpingDto.endTimestamp,
            remarks: 'dumping end',
        };

        // Buat objek baru dan hapus properti yang tidak diperlukan
        const newTargetReading = { ...targetReading };
        delete newTargetReading.id;
        delete newTargetReading.created_at;

        // Isi dengan nilai-nilai baru
        newTargetReading.psi = newTargetPsi;
        newTargetReading.operator_id = user.id;
        newTargetReading.recorded_at = dumpingDto.endTimestamp;
        newTargetReading.remarks = `Refilled from storage ${dumpingDto.dumpingStorageNumber}`;

        // 5. Masukkan ketiga catatan sekaligus dalam satu operasi
        const { data: createdRecords, error: insertError } = await this.supabase
            .from('readings')
            .insert([startDumpingReading, endDumpingReading, newTargetReading])
            .select();

        if (insertError) {
            console.error('Supabase Insert Error:', insertError);
            throw new InternalServerErrorException(`Failed to create records: ${insertError.message}`);
        }

        return createdRecords;
    }

    async getDumpingSummary() {
        const { data, error } = await this.supabase
            .from('readings')
            .select('id, customer_code, storage_number, psi, recorded_at, remarks, customers(name)')
            .ilike('remarks', '%dumping%')
            .order('storage_number', { ascending: true })
            .order('recorded_at', { ascending: true })
            .order('id', { ascending: true });

        if (error) throw new InternalServerErrorException(error.message);
        if (!data || data.length === 0) return [];

        const groups: Record<string, AnyRow[]> = {};
        for (const r of data) {
            const key = String(r.storage_number);
            if (!groups[key]) groups[key] = [];
            groups[key].push(r);
        }

        const result: AnyRow[] = [];
        for (const key of Object.keys(groups)) {
            const rows = groups[key];
            let i = 0;
            while (i < rows.length - 1) {
                const start = rows[i];
                const next = rows[i + 1];
                if (start?.remarks === 'dumping start' && next?.remarks === 'dumping end') {
                    const dumpingValue = Number(start.psi) - Number(next.psi);
                    result.push({
                        isDumpingRow: true,
                        customer_code: start.customer_code,
                        customerName: start.customers?.[0]?.name ?? 'N/A',
                        storage_number: start.storage_number,
                        startPsi: start.psi,
                        endPsi: next.psi,
                        dumpingValue: dumpingValue > 0 ? dumpingValue : 0,
                        startTime: start.recorded_at,
                        endTime: next.recorded_at,
                    });
                    i += 2;
                } else {
                    i += 1;
                }
            }
        }
        return result;
    }

    async create(readingData: CreateReadingDto, operatorId: string) {
        const { manual_created_at, ...rest } = readingData;
        const payload: AnyRow = { ...rest, operator_id: operatorId };

        if (manual_created_at) {
            const date = new Date(manual_created_at);
            const minutes = date.getUTCMinutes();
            if (minutes >= 45) date.setUTCHours(date.getUTCHours() + 1);
            date.setUTCMinutes(0, 0, 0);
            payload.recorded_at = date.toISOString();
        }

        const { data, error } = await this.supabase.from('readings').insert(payload).select().single();
        if (error) throw new InternalServerErrorException(error.message);
        return data;
    }

    async findAll() {
        const { data: readings, error } = await this.supabase
            .from('readings')
            .select(`*, customers (name), profiles (username)`)
            .not('remarks', 'ilike', '%dumping%')
            .order('customer_code', { ascending: true })
            .order('storage_number', { ascending: true })
            .order('recorded_at', { ascending: true });

        if (error) throw new InternalServerErrorException(error.message);
        if (!readings || readings.length === 0) return [];

        const processed: AnyRow[] = [];
        let currentBlock: AnyRow[] = [];

        const processBlock = (block: AnyRow[]) => {
            if (block.length === 0) return;
            let totalFlowMeter = 0;
            const withFlow = block.map((r, idx) => {
                const prev = idx > 0 ? block[idx - 1] : null;
                let flowMeter: number | null = null;
                if (prev) {
                    const diff = Number(r.flow_turbine) - Number(prev.flow_turbine);
                    flowMeter = diff > 0 ? diff : 0;
                }
                if (flowMeter !== null) totalFlowMeter += flowMeter;
                return { ...r, flowMeter };
            });
            processed.push(...withFlow);
            const startTime = new Date(block[0].recorded_at);
            const endTime = new Date(block[block.length - 1].recorded_at);
            const durationMs = endTime.getTime() - startTime.getTime();
            const hours = Math.floor(durationMs / 3600000);
            const minutes = Math.floor((durationMs % 3600000) / 60000);
            const totalDuration = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            processed.push({
                isChangeRow: true,
                customer_code: block[0].customer_code,
                customerName: block[0].customers?.[0]?.name || 'N/A',
                storage_number: block[0].storage_number,
                totalFlowMeter,
                totalDuration,
            });
        };

        for (const r of readings) {
            if (currentBlock.length === 0 || r.storage_number === currentBlock[0].storage_number) {
                currentBlock.push(r);
            } else {
                processBlock(currentBlock);
                currentBlock = [r];
            }
        }
        processBlock(currentBlock);
        return processed;
    }

    async findOne(id: number) {
        const { data, error } = await this.supabase
            .from('readings')
            .select(`*, customers (name), profiles (username)`)
            .eq('id', id)
            .single();
        if (error) throw new InternalServerErrorException(error.message);
        if (!data) throw new NotFoundException(`Reading with ID ${id} not found.`);
        return data;
    }

    async findReadingsByOperator(operatorId: string) {
        const { data, error } = await this.supabase
            .from('readings')
            .select(`*, customers (name)`)
            .eq('operator_id', operatorId)
            .order('recorded_at', { ascending: false })
            .limit(10);
        if (error) throw new InternalServerErrorException(error.message);
        return data;
    }

    async update(id: number, updateDto: UpdateReadingDto, user: any) {
        const { data: reading, error: findError } = await this.supabase.from('readings').select('operator_id, recorded_at').eq('id', id).single();
        if (findError || !reading) throw new NotFoundException(`Reading with ID ${id} not found.`);
        if (user.role === 'operator') {
            if (reading.operator_id !== user.id) throw new ForbiddenException('You can only edit your own readings.');
            const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
            if (new Date(reading.recorded_at) < twoHoursAgo) throw new ForbiddenException('You can no longer edit this reading after 2 hours.');
        }
        const { data, error } = await this.supabase.from('readings').update(updateDto).eq('id', id).select().single();
        if (error) throw new InternalServerErrorException(error.message);
        return data;
    }

    async remove(id: number, user: any) {
        const { data: reading, error: findError } = await this.supabase.from('readings').select('operator_id, recorded_at').eq('id', id).single();
        if (findError || !reading) throw new NotFoundException(`Reading with ID ${id} not found.`);
        if (user.role === 'operator') {
            if (reading.operator_id !== user.id) throw new ForbiddenException('You can only delete your own readings.');
            const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
            if (new Date(reading.recorded_at) < twoHoursAgo) throw new ForbiddenException('You can no longer delete this reading after 2 hours.');
        }
        const { error } = await this.supabase.from('readings').delete().eq('id', id);
        if (error) throw new InternalServerErrorException(error.message);
    }

    async getOperatorCounts() {
        const { data, error } = await this.supabase.rpc('get_operator_reading_counts');
        if (error) throw new InternalServerErrorException(error.message);
        return data;
    }
}