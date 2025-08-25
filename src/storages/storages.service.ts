import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateStorageDto } from './dto/create-storage.dto';
import { UpdateStorageDto } from './dto/update-storage.dto';

@Injectable()
export class StoragesService {
    constructor(private readonly supabaseService: SupabaseService) { }

    private get supabase() {
        return this.supabaseService.getAdminClient();
    }

    async create(storageData: CreateStorageDto) {
        const { data, error } = await this.supabase.from('storages').insert(storageData).select().single();
        if (error) throw new InternalServerErrorException(error.message);
        return data;
    }

    async findAll() {
        const { data, error } = await this.supabase.from('storages').select('*');
        if (error) throw new InternalServerErrorException(error.message);
        return data;
    }

    async findOneById(id: number) {
        const { data, error } = await this.supabase.from('storages').select('*').eq('id', id).single();
        if (error) {
            if (error.code === 'PGRST116') throw new NotFoundException(`Storage with ID "${id}" not found.`);
            throw new InternalServerErrorException(error.message);
        }
        if (!data) throw new NotFoundException(`Storage with ID "${id}" not found.`);
        return data;
    }

    async update(id: number, updateDto: UpdateStorageDto) {
        const { data, error } = await this.supabase.from('storages').update(updateDto).eq('id', id).select().single();
        if (error) {
            if (error.code === 'PGRST116') throw new NotFoundException(`Storage with ID "${id}" not found.`);
            throw new InternalServerErrorException(error.message);
        }
        if (!data) throw new NotFoundException(`Storage with ID "${id}" not found.`);
        return data;
    }

    async remove(id: number) {
        // Pertama, pastikan data ada sebelum dihapus
        const { data: existing, error: findError } = await this.supabase.from('storages').select('id').eq('id', id).single();
        if (findError || !existing) {
            throw new NotFoundException(`Storage with ID "${id}" not found.`);
        }

        const { error } = await this.supabase.from('storages').delete().eq('id', id);
        if (error) throw new InternalServerErrorException(error.message);
    }
}
