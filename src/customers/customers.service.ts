import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { SupabaseService } from '../supabase/supabase.service';
import { PostgrestError } from '@supabase/supabase-js';

@Injectable()
export class CustomersService {
  constructor(private readonly supabaseService: SupabaseService) { }

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
    if (error.code === 'PGRST116') {
      throw new NotFoundException(`The requested resource was not found.`);
    }
    if (error.code === '23505') {
      throw new InternalServerErrorException(
        `Customer with this code already exists.`,
      );
    }
    throw new InternalServerErrorException(
      `An unexpected database error occurred: ${error.message}`,
    );
  }

  async create(customerData: CreateCustomerDto, token: string) {
    const supabase = this.supabaseService.getClient(token);
    const { data, error } = await supabase
      .from('customers')
      .insert(customerData)
      .select()
      .single();
    this.handleSupabaseError(error, 'create customer');
    return data;
  }

  async findAll(token: string) {
    const supabase = this.supabaseService.getAdminClient();
    const { data, error } = await supabase.from('customers').select('*');
    this.handleSupabaseError(error, 'findAll customers');
    return data;
  }

  async update(id: number, updateData: UpdateCustomerDto, token: string) {
    const supabase = this.supabaseService.getClient(token);
    const { data, error } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    this.handleSupabaseError(error, `update customer: ${id}`);
    return data;
  }

  async remove(id: number, token: string) {
    const supabase = this.supabaseService.getClient(token);
    const { error } = await supabase.from('customers').delete().eq('id', id);
    this.handleSupabaseError(error, `remove customer: ${id}`);
  }
}