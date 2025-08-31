import { 
    Injectable, 
    NotFoundException, 
    InternalServerErrorException,
    ForbiddenException
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateStorageDto } from './dto/create-storage.dto';
import { UpdateStorageDto } from './dto/update-storage.dto';
import { PostgrestError } from '@supabase/supabase-js';

@Injectable()
export class StoragesService {
    constructor(private readonly supabaseService: SupabaseService) {}
    
    private handleSupabaseError(error: PostgrestError | null, context: string): void {
        if (!error) return;
        console.error(`Supabase error in ${context}:`, error.message);

        if (error.code === '42501') {
            throw new ForbiddenException('You do not have permission to perform this action.');
        }
        if (error.code === 'PGRST116') {
            throw new NotFoundException(`The requested resource was not found.`);
        }
        if (error.code === '23505') {
            throw new InternalServerErrorException(`Storage with this number already exists.`);
        }
        throw new InternalServerErrorException(`An unexpected database error occurred: ${error.message}`);
    }

    async create(storageData: CreateStorageDto, token: string) {
        const supabase = this.supabaseService.getClient(token);
        const { data, error } = await supabase.from('storages').insert(storageData).select().single();
        this.handleSupabaseError(error, 'create storage');
        return data;
    }

    async findAll(token: string) {
        const supabase = this.supabaseService.getClient(token);
        const { data, error } = await supabase.from('storages').select('*');
        this.handleSupabaseError(error, 'findAll storages');
        return data;
    }

    async findOneById(id: number, token: string) {
        const supabase = this.supabaseService.getClient(token);
        const { data, error } = await supabase.from('storages').select('*').eq('id', id).single();
        this.handleSupabaseError(error, `findOneById storage: ${id}`);
        return data;
    }

    async findRelevantForOperator(customerCode: string, token: string) {
        const supabase = this.supabaseService.getClient(token);
        const { data, error } = await supabase.rpc('get_relevant_storages', {
            customer_code_param: customerCode,
        });

        this.handleSupabaseError(error, `findRelevantForOperator for customer: ${customerCode}`);
        return data;
    }

    async update(id: number, updateDto: UpdateStorageDto, token: string) {
        const supabase = this.supabaseService.getClient(token);
        const { data, error } = await supabase.from('storages').update(updateDto).eq('id', id).select().single();
        this.handleSupabaseError(error, `update storage: ${id}`);
        return data;
    }

    async remove(id: number, token: string) {
        const supabase = this.supabaseService.getClient(token);
        const { error } = await supabase.from('storages').delete().eq('id', id);
        this.handleSupabaseError(error, `remove storage: ${id}`);
    }
}