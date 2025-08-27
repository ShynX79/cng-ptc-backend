import { Injectable, NotFoundException, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { PostgrestError } from '@supabase/supabase-js';

@Injectable()
export class ProfilesService {
    constructor(private readonly supabaseService: SupabaseService) { }

    private handleSupabaseError(error: PostgrestError | null, context: string): void {
        if (!error) return;
        console.error(`Supabase error in ${context}:`, error.message);
        if (error.code === '42501') {
            throw new ForbiddenException('You do not have permission to perform this action.');
        }
        if (error.code === 'PGRST116') {
            throw new NotFoundException(`Profile not found.`);
        }
        throw new InternalServerErrorException(error.message);
    }
    
    async findOne(id: string, token: string) {
        const supabase = this.supabaseService.getClient(token);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();
        
        this.handleSupabaseError(error, `findOne profile: ${id}`);
        return data;
    }
}