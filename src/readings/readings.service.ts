import {
    Injectable,
    InternalServerErrorException,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateReadingDto } from './dto/create-reading.dto';
import { UpdateReadingDto } from './dto/update-reading.dto';
import { PostgrestError } from '@supabase/supabase-js';
import { QueryReadingDto } from './dto/query-reading.dto';
import { CreateDumpingDto } from './dto/create-dumping.dto';
import { CreateChangeDto } from './dto/create-change.dto';

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
        const [hourStr, minuteStr] = readingData.manual_created_at.split(":");
        let hour = parseInt(hourStr, 10);
        const minute = parseInt(minuteStr, 10);
        if (minute >= 45) {
            hour += 1;
        }
        const recordedDate = new Date(
            localDate.getFullYear(),
            localDate.getMonth(),
            localDate.getDate(),
            hour, 0, 0
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
            p_remarks: readingData.remarks
        });

        this.handleSupabaseError(error, 'create reading with backfill');
        return { message: 'Reading created successfully.' };
    }

    async createChange(changeData: CreateChangeDto, operatorId: string, token: string) {
        const supabase = this.supabaseService.getClient(token);

        const { data: lastReading, error: lastReadingError } = await supabase
            .from('readings')
            .select('*')
            .eq('storage_number', changeData.old_storage_number)
            .order('recorded_at', { ascending: false })
            .limit(1)
            .single();

        if (lastReadingError || !lastReading) {
            throw new NotFoundException(`Tidak ditemukan data pembacaan sebelumnya untuk storage ${changeData.old_storage_number}.`);
        }

        const { error } = await supabase.rpc('perform_storage_change', {
            p_operator_id: operatorId,
            p_customer_code: lastReading.customer_code,
            p_old_storage: changeData.old_storage_number,
            p_new_storage: changeData.new_storage_number,
            p_old_psi_after: changeData.old_storage_final_psi,
            p_new_psi_before: changeData.new_storage_initial_psi,
            p_temp: lastReading.temp,
            p_psi_out: lastReading.psi_out,
            p_flow_turbine: lastReading.flow_turbine,
            p_time: changeData.time
        });

        this.handleSupabaseError(error, 'perform storage change');
        return { message: 'Storage change recorded successfully.' };
    }

    async createDumping(dumpingData: CreateDumpingDto, operatorId: string, token: string) {
        const supabase = this.supabaseService.getClient(token);

        const { error } = await supabase.rpc('perform_dumping', {
            p_operator_id: operatorId,
            p_customer_code: dumpingData.customer_code,
            p_source_storage: dumpingData.source_storage_number,
            p_dest_storage: dumpingData.destination_storage_number,
            p_source_psi_before: dumpingData.source_psi_before,
            p_source_psi_after: dumpingData.source_psi_after,
            p_dest_psi_before: dumpingData.destination_psi_before,
            p_dest_psi_after: dumpingData.destination_psi_after,
            p_source_temp_before: dumpingData.source_temp_before,
            p_source_temp_after: dumpingData.source_temp_after,
            p_dest_temp: dumpingData.destination_temp,
            p_psi_out: dumpingData.psi_out,
            p_flow_turbine_before: dumpingData.flow_turbine_before,
            p_flow_turbine_after: dumpingData.flow_turbine_after,
            p_time_before: dumpingData.time_before,
            p_time_after: dumpingData.time_after
        });

        this.handleSupabaseError(error, 'perform dumping');
        return { message: 'Dumping process recorded successfully.' };
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

        const processedData: any[] = [];
        let i = 0;

        const sortedReadings = [...rawReadings].sort((a, b) => {
            const timeA = new Date(a.recorded_at).getTime();
            const timeB = new Date(b.recorded_at).getTime();
            if (timeA !== timeB) return timeA - timeB;
            const remarksA = a.remarks || '';
            const remarksB = b.remarks || '';
            if (remarksA !== remarksB) return remarksA.localeCompare(remarksB);
            return a.id - b.id;
        });

        while (i < sortedReadings.length) {
            const current = sortedReadings[i];
            const next = sortedReadings[i + 1];
            const next2 = sortedReadings[i + 2];
            const next3 = sortedReadings[i + 3];

            const isChangePair = next && current.recorded_at === next.recorded_at &&
                ((current.remarks === 'Change: Old Storage Out' && next.remarks === 'Change: New Storage In') ||
                    (current.remarks === 'Change: New Storage In' && next.remarks === 'Change: Old Storage Out'));

            if (isChangePair) {
                const oldStorage = current.remarks === 'Change: Old Storage Out' ? current : next;
                const newStorage = current.remarks === 'Change: New Storage In' ? current : next;

                oldStorage.isChangeTrue = true;
                newStorage.isChangeTrue = true;

                processedData.push(oldStorage);
                processedData.push({ type: 'CHANGE_SUMMARY', id: `summary_change_${current.id}`, duration: 'CHANGE' });
                processedData.push(newStorage);
                i += 2;
                continue;
            }

            if (
                current.remarks === 'Dumping: Destination Before' &&
                next?.remarks === 'Dumping: Source Before' &&
                next2?.remarks === 'Dumping: Source After' &&
                next3?.remarks === 'Dumping: Destination After'
            ) {
                current.isDumpingTrue = true;
                next.isDumpingTrue = true;
                next2.isDumpingTrue = true;
                next3.isDumpingTrue = true;

                processedData.push(current, next);
                processedData.push({ type: 'DUMPING_SUMMARY', id: `summary_dumping_${current.id}`, duration: 'DUMPING' });
                processedData.push(next2, next3);
                i += 4;
                continue;
            }

            current.isChangeTrue = false;
            current.isDumpingTrue = false;
            processedData.push(current);
            i++;
        }

        if (filters.sortOrder === 'desc') {
            return processedData.reverse();
        }

        return processedData;
    }

    async findOne(id: number, token: string) {
        const supabase = this.supabaseService.getClient(token);
        const { data, error } = await supabase
            .from('readings')
            .select(`*, customers (name), profiles (username)`)
            .eq('id', id)
            .single();

        this.handleSupabaseError(error, `findOne reading id: ${id}`);
        return data;
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
}
