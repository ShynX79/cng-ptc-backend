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
  constructor(private readonly supabaseService: SupabaseService) {}

  private handleSupabaseError(
    error: PostgrestError | null,
    context: string,
  ): void {
    if (!error) return;
    console.error(`Supabase error in ${context}:`, error.message);
    if (error.code === '42501') {
      throw new ForbiddenException(
        'You do not have permission to perform this action.',
      );
    }
    if (error.code === 'PGRST116' || error.code === '20000') {
      throw new NotFoundException(`Profile not found.`);
    }
    if (error.code === '23505') {
      throw new ConflictException(
        'User with this email or username already exists.',
      );
    }
    throw new InternalServerErrorException(error.message);
  }

  // ... (method create, findAll, update tidak berubah)
  async create(createProfileDto: CreateProfileDto) {
    const supabaseAdmin = this.supabaseService.getAdminClient();
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
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
    return {
      message: 'User created successfully.',
      user: { ...result, id: authData.user.id },
    };
  }

  async findAll(token: string) {
    const supabaseAdmin = this.supabaseService.getAdminClient();
    const {
      data: { users: authUsers },
      error: authError,
    } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) {
      throw new InternalServerErrorException(authError.message);
    }
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*');
    this.handleSupabaseError(profileError, 'findAll profiles');
    if (!profiles) return [];
    const usersWithProfiles = authUsers
      .map((user) => {
        const profile = profiles.find((p) => p.id === user.id);
        return {
          id: user.id,
          username: profile?.username || 'N/A',
          role: profile?.role || 'N/A',
          email: user.email,
        };
      })
      .filter((p) => p.role !== 'N/A');
    return usersWithProfiles;
  }

  async update(id: string, updateProfileDto: UpdateProfileDto, token: string) {
    const supabaseAdmin = this.supabaseService.getAdminClient();
    if (updateProfileDto.password) {
      const { error: authError } =
        await supabaseAdmin.auth.admin.updateUserById(id, {
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
    const supabase = this.supabaseService.getClient(token);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    this.handleSupabaseError(error, `fetch updated profile: ${id}`);
    return data;
  }

  // 👇 LOGIKA YANG DIPERBAIKI ADA DI SINI 👇
  async remove(id: string): Promise<void> {
    const supabaseAdmin = this.supabaseService.getAdminClient();

    const { error } = await supabaseAdmin.rpc('delete_user_fully', {
      user_id: id,
    });

    if (error) {
      console.error('Error calling delete_user_fully function:', error);
      throw new InternalServerErrorException(
        'Failed to delete user completely.',
      );
    }
  }
}
