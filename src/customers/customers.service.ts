// ================================================================
// FILE: src/customers/customers.service.ts
// ================================================================
import {
    Injectable,
    NotFoundException,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { SupabaseService } from '../supabase/supabase.service';
import { PostgrestError } from '@supabase/supabase-js';

@Injectable()
export class CustomersService {
    private readonly logger = new Logger(CustomersService.name);

    constructor(private readonly supabaseService: SupabaseService) { }

    private get supabase() {
        return this.supabaseService.getAdminClient();
    }

    private handleSupabaseError(error: PostgrestError | null, context: string): void {
        if (!error) return;
        this.logger.error(`Supabase error in ${context}: ${error.message}`, error.details);
        if (error.code === 'PGRST116') {
            throw new NotFoundException(`Customer not found.`);
        }
        throw new InternalServerErrorException('An unexpected database error occurred.');
    }

    async create(customerData: CreateCustomerDto) {
        const { data, error } = await this.supabase.from('customers').insert(customerData).select().single();
        this.handleSupabaseError(error, 'create');
        return data;
    }

    async findAll() {
        const { data, error } = await this.supabase.from('customers').select('*');
        this.handleSupabaseError(error, 'findAll');
        return data;
    }

    async findOneById(id: number) {
        const { data, error } = await this.supabase.from('customers').select('*').eq('id', id).single();
        this.handleSupabaseError(error, `findOneById: ${id}`);
        if (!data) throw new NotFoundException(`Customer with id "${id}" not found.`);
        return data;
    }

    async update(id: number, updateData: UpdateCustomerDto) {
        const { data, error } = await this.supabase.from('customers').update(updateData).eq('id', id).select().single();
        this.handleSupabaseError(error, `update: ${id}`);
        if (!data) throw new NotFoundException(`Customer with id "${id}" not found.`);
        return data;
    }

    async remove(id: number) {
        const { data: existing, error: findError } = await this.supabase.from('customers').select('id').eq('id', id).single();
        if (findError || !existing) {
            throw new NotFoundException(`Customer with ID "${id}" not found.`);
        }
        const { error } = await this.supabase.from('customers').delete().eq('id', id);
        this.handleSupabaseError(error, `remove: ${id}`);
    }

    async testConnection() {
        try {
            const { data, error } = await this.supabase.from('customers').select('id').limit(1);
            this.handleSupabaseError(error, 'testConnection');
            return { status: 'ok', message: 'Supabase connection successful', sample: data?.[0] || null };
        } catch (err) {
            this.logger.error('Failed to test Supabase connection', err as any);
            throw new InternalServerErrorException('Supabase connection failed');
        }
    }
}
