import {
    Injectable,
    NotFoundException,
    InternalServerErrorException,
    ForbiddenException,
    ConflictException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { PostgrestError } from '@supabase/supabase-js';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfilesService {
    constructor(private readonly supabaseService: SupabaseService) { }

    private handleSupabaseError(error: PostgrestError | null, context: string): void {
        if (!error) return;
        console.error(`Supabase error in ${context}:`, error.message);
        if (error.code === '42501') {
            throw new ForbiddenException('You do not have permission to perform this action.');
        }
        if (error.code === 'PGRST116' || error.code === '20000') {
            throw new NotFoundException(`Profile not found.`);
        }
        if (error.code === '23505') {
            throw new ConflictException('User with this email or username already exists.');
        }
        throw new InternalServerErrorException(error.message);
    }

    async create(createProfileDto: CreateProfileDto) {
        const supabaseAdmin = this.supabaseService.getAdminClient();

        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: createProfileDto.email,
            password: createProfileDto.password,
            email_confirm: true,
        });

        if (authError) {
            console.error('Supabase auth error:', authError.message);
            if (authError.message.includes('User already registered')) {
                throw new ConflictException('A user with this email already exists.');
            }
            throw new InternalServerErrorException(authError.message);
        }

        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert({
                id: authData.user.id,
                username: createProfileDto.username,
                role: createProfileDto.role,
            });

        if (profileError) {
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            this.handleSupabaseError(profileError, 'create profile');
        }

        const { password, ...result } = createProfileDto;
        return { message: 'User created successfully.', user: { ...result, id: authData.user.id } };
    }

    async findAll(token: string) {
        const supabase = this.supabaseService.getClient(token);
        const { data, error } = await supabase.from('profiles').select('*');
        this.handleSupabaseError(error, 'findAll profiles');
        return data;
    }

    async findOne(id: string, token: string) {
        const supabase = this.supabaseService.getClient(token);
        const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
        this.handleSupabaseError(error, `findOne profile: ${id}`);
        return data;
    }

    async update(id: string, updateProfileDto: UpdateProfileDto, token: string) {
        const supabaseAdmin = this.supabaseService.getAdminClient();

        if (updateProfileDto.password) {
            const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, {
                password: updateProfileDto.password,
            });
            if (authError) throw new InternalServerErrorException(authError.message);
        }

        if (updateProfileDto.username) {
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .update({ username: updateProfileDto.username })
                .eq('id', id);
            this.handleSupabaseError(profileError, `update profile username: ${id}`);
        }

        return this.findOne(id, token);
    }

    async remove(id: string) {
        const supabaseAdmin = this.supabaseService.getAdminClient();
        const { error } = await supabaseAdmin.auth.admin.deleteUser(id);

        if (error) {
            if (error.message.toLowerCase().includes('not found')) {
                throw new NotFoundException(`User with ID ${id} not found.`);
            }
            throw new InternalServerErrorException(error.message);
        }
    }
}