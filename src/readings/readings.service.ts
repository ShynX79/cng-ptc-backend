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
import { QueryReadingDto } from './dto/query-reading.dto'; // [TAMBAHAN] Import DTO baru

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

    // [PERUBAHAN] Menggunakan RPC add_reading_with_backfill
    async create(readingData: CreateReadingDto, operatorId: string, token: string) {
        const supabase = this.supabaseService.getClient(token);
        
        // Aturan pembulatan waktu dari frontend (cng-next/components/data-entry-form.tsx)
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
        // RPC ini tidak mengembalikan data, jadi kita kembalikan pesan sukses
        return { message: 'Reading created successfully.' };
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
    
    // [PERUBAHAN] Menggunakan RPC get_readings_with_flowmeter untuk filter dan kalkulasi
    async findAll(token: string, filters: QueryReadingDto) {
        const supabase = this.supabaseService.getClient(token);
        
        const { data, error } = await supabase.rpc('get_readings_with_flowmeter', {
            customer_filter: filters.customer || 'all',
            operator_filter: filters.operator || 'all',
            search_term: filters.searchTerm || '',
            sort_order: filters.sortOrder || 'asc',
        });

        this.handleSupabaseError(error, 'findAll readings with flowmeter');
        return data || [];
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