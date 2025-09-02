import {
    Injectable,
    InternalServerErrorException,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateReadingDto } from './dto/create-reading.dto';
import { UpdateReadingDto } from './dto/update-reading.dto';
import { PostgrestError } from '@supabase/supabase-js';
import { QueryReadingDto } from './dto/query-reading.dto';
import { CreateDumpingDto } from './dto/dumping-reading.dto';
import {
    RawReading,
    ProcessedRow,
    ReadingWithFlowMeter,
} from './dto/processed-reading.dto';

@Injectable()
export class ReadingsService {
    constructor(private readonly supabaseService: SupabaseService) { }

    private handleSupabaseError(error: PostgrestError | null, context: string): void {
        if (!error) return;
        console.error(`Supabase error in ${context}:`, error.message);
        if (error.code === '42501') {
            throw new ForbiddenException('You do not have permission to perform this action.');
        }
        if (error.code === 'PGRST116') {
            throw new NotFoundException(`The requested resource was not found in context: ${context}`);
        }
        throw new InternalServerErrorException(`An unexpected database error occurred: ${error.message}`);
    }

    async create(readingData: CreateReadingDto, operatorId: string, token: string) {
        const supabase = this.supabaseService.getClient(token);
        const localDate = new Date();
        
        // Waktu sekarang diambil persis dari input DTO (HH:mm)
        const [hour, minute] = readingData.manual_created_at.split(':').map(Number);

        // Buat timestamp menggunakan tanggal hari ini dengan jam dan menit dari input
        const recordedDate = new Date(
            localDate.getFullYear(),
            localDate.getMonth(),
            localDate.getDate(),
            hour,
            minute,
            0, // Detik diatur ke 0
        );

        const finalTimestamp = recordedDate.toISOString();

        const { error } = await supabase.rpc('add_reading_with_backfill', {
            p_recorded_at: finalTimestamp,
            p_customer_code: readingData.customer_code,
            p_operator_id: operatorId,
            p_storage_number: readingData.storage_number,
            p_fixed_storage_quantity: readingData.fixed_storage_quantity,
            p_psi: readingData.psi,
            p_temp: readingData.temp,
            p_psi_out: readingData.psi_out,
            p_flow_turbine: readingData.flow_turbine,
            p_remarks: readingData.remarks,
        });

        this.handleSupabaseError(error, 'create reading with backfill');
        return { message: 'Reading created successfully.' };
    }

    async findAll(token: string, filters: QueryReadingDto) {
        const supabase = this.supabaseService.getClient(token);

        const { data: rawReadings, error } = await supabase.rpc('get_readings_with_flowmeter', {
            customer_filter: filters.customer || 'all',
            operator_filter: filters.operator || 'all',
            search_term: filters.searchTerm || '',
            sort_order: 'asc',
        });

        this.handleSupabaseError(error, 'findAll readings with flowmeter');

        if (!rawReadings || rawReadings.length === 0) {
            return [];
        }

        const sorted = (rawReadings as any[]).slice().sort((a, b) => {
            const da = new Date(a.recorded_at).getTime();
            const db = new Date(b.recorded_at).getTime();
            if (da !== db) return da - db;
            return Number(a.id) - Number(b.id);
        });

        if (filters.sortOrder === 'desc') {
            return sorted.slice().reverse();
        }

        return sorted;
    }

    async update(id: number, updateDto: UpdateReadingDto, token: string) {
        const supabase = this.supabaseService.getClient(token);
        const { data, error } = await supabase
            .from('readings')
            .update(updateDto)
            .eq('id', id)
            .select()
            .single();

        this.handleSupabaseError(error, `update reading id: ${id}`);
        return data;
    }

    async remove(id: number, token: string) {
        const supabase = this.supabaseService.getClient(token);
        const { error } = await supabase.from('readings').delete().eq('id', id);
        this.handleSupabaseError(error, `remove reading id: ${id}`);
    }

    async removeAll(token: string) {
        const supabase = this.supabaseService.getClient(token);
        const { error } = await supabase.from('readings').delete().not('id', 'is', null);
        this.handleSupabaseError(error, `remove all readings`);
    }

    async findReadingsByOperator(operatorId: string, token: string) {
        const supabase = this.supabaseService.getClient(token);
        const { data, error } = await supabase
            .from('readings')
            .select(`*, customers (name)`)
            .eq('operator_id', operatorId)
            .order('recorded_at', { ascending: false })
            .limit(10);

        this.handleSupabaseError(error, `findReadingsByOperator for operator: ${operatorId}`);
        return data;
    }

    async getOperatorCounts() {
        const supabase = this.supabaseService.getAdminClient();
        const { data, error } = await supabase.rpc('get_operator_reading_counts');
        if (error) {
            console.error(`Supabase error in getOperatorCounts RPC:`, error.message);
            throw new InternalServerErrorException(error.message);
        }
        return data;
    }

    async getProcessedReadingsByCustomer(token: string, customerCode: string): Promise<ProcessedRow[]> {
        const supabase = this.supabaseService.getClient(token);

        const { data: rawReadings, error } = await supabase
            .from('readings')
            .select('id, customer_code, storage_number, operation_type, flow_turbine, recorded_at, fixed_storage_quantity, psi, temp, psi_out, remarks')
            .eq('customer_code', customerCode)
            .order('recorded_at', { ascending: true });

        this.handleSupabaseError(error, `fetching readings for processing customer: ${customerCode}`);

        if (!rawReadings || rawReadings.length === 0) {
            return [];
        }

        return this._processReadingsLogic(rawReadings as RawReading[]);
    }

    private _processReadingsLogic(readings: RawReading[]): ProcessedRow[] {
        const readingsWithFlowMeter: ReadingWithFlowMeter[] = readings.map(
            (current, index, arr) => {
                let flowMeter: number | string = '-';
                const previous = arr[index - 1];

                if (
                    previous &&
                    current.storage_number === previous.storage_number &&
                    current.operation_type === previous.operation_type
                ) {
                    const diff = Number(current.flow_turbine) - Number(previous.flow_turbine);
                    flowMeter = isNaN(diff) || diff < 0 ? '-' : diff;
                }
                return { ...current, flowMeter };
            },
        );

        const result: ProcessedRow[] = [];
        let i = 0;
        while (i < readingsWithFlowMeter.length) {
            const startReading = readingsWithFlowMeter[i];

            if (startReading.operation_type === 'manual') {
                let endIndex = i;
                while (
                    endIndex + 1 < readingsWithFlowMeter.length &&
                    readingsWithFlowMeter[endIndex + 1].storage_number === startReading.storage_number &&
                    readingsWithFlowMeter[endIndex + 1].operation_type === 'manual'
                ) {
                    endIndex++;
                }

                const manualBlock = readingsWithFlowMeter.slice(i, endIndex + 1);
                result.push(...manualBlock);

                const lastReadingInBlock = manualBlock[manualBlock.length - 1];
                const nextReading = readingsWithFlowMeter[endIndex + 1];

                if (nextReading) {
                    const totalFlow = manualBlock.reduce((sum, r) => sum + (Number(r.flowMeter) || 0), 0);
                    const startTime = new Date(manualBlock[0].recorded_at);
                    const endTime = new Date(lastReadingInBlock.recorded_at);

                    if (nextReading.operation_type === 'dumping') {
                        const endTimeStr = endTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
                        result.push({
                            id: `total-before-dump-${lastReadingInBlock.id}`,
                            isDumpingTotalRow: true, totalFlow, duration: endTimeStr,
                            customer_code: lastReadingInBlock.customer_code,
                            recorded_at: lastReadingInBlock.recorded_at,
                            storage_number: lastReadingInBlock.storage_number,
                        });
                    } else if (nextReading.storage_number !== lastReadingInBlock.storage_number) {
                        const diffMs = endTime.getTime() - startTime.getTime();
                        const diffMinutes = Math.floor(diffMs / 60000);
                        const pad = (num: number) => String(num).padStart(2, '0');
                        const durationStr = `${pad(Math.floor(diffMinutes / 60))}:${pad(diffMinutes % 60)}`;
                        result.push({
                            id: `change-${lastReadingInBlock.id}`, isChangeRow: true,
                            totalFlow, duration: durationStr,
                            customer_code: lastReadingInBlock.customer_code,
                            recorded_at: lastReadingInBlock.recorded_at,
                        });
                    }
                }
                i = endIndex + 1;
            }
            else if (startReading.operation_type === 'dumping') {
                let endIndex = i;
                while (
                    endIndex + 1 < readingsWithFlowMeter.length &&
                    readingsWithFlowMeter[endIndex + 1].operation_type === 'dumping'
                ) {
                    endIndex++;
                }
                const dumpingBlock = readingsWithFlowMeter.slice(i, endIndex + 1);
                result.push(...dumpingBlock);

                const startTime = new Date(dumpingBlock[0].recorded_at);
                const endTime = new Date(dumpingBlock[dumpingBlock.length - 1].recorded_at);
                const diffMs = endTime.getTime() - startTime.getTime();
                const diffMinutes = Math.floor(diffMs / 60000);
                const pad = (num: number) => String(num).padStart(2, '0');
                const duration = `${pad(Math.floor(diffMinutes / 60))}:${pad(diffMinutes % 60)}`;

                result.push({
                    id: `dumping-summary-${startReading.id}`, isDumpingSummary: true,
                    totalFlow: 0, duration,
                    customer_code: startReading.customer_code,
                    recorded_at: endTime.toISOString(),
                });
                i = endIndex + 1;
            } else {
                result.push(startReading);
                i++;
            }
        }
        return result;
    }

        async createDumping(dumpingData: CreateDumpingDto, operatorId: string, token: string) {
        const supabase = this.supabaseService.getClient(token);

        const { error } = await supabase.rpc('handle_dumping_operation', {
            p_customer_code: dumpingData.customer_code,
            p_operator_id: operatorId, // Gunakan ID dari token, lebih aman
            p_source_storage_number: dumpingData.source_storage_number,
            p_destination_storage_number: dumpingData.destination_storage_number,
            p_source_psi_before: dumpingData.source_psi_before,
            p_source_psi_after: dumpingData.source_psi_after,
            p_source_temp_before: dumpingData.source_temp_before,
            p_source_temp_after: dumpingData.source_temp_after,
            p_destination_psi_after: dumpingData.destination_psi_after,
            p_destination_temp: dumpingData.destination_temp,
            p_flow_turbine_before: dumpingData.flow_turbine_before,
            p_flow_turbine_after: dumpingData.flow_turbine_after,
            p_psi_out: dumpingData.psi_out,
            p_time_before: dumpingData.time_before,
            p_time_after: dumpingData.time_after,
        });

        this.handleSupabaseError(error, 'create dumping reading');
        return { message: 'Dumping operation recorded successfully.' };
    }
}

