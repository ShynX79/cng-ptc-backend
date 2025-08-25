import { Injectable, InternalServerErrorException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateReadingDto } from './dto/create-reading.dto';
import { UpdateReadingDto } from './dto/update-reading.dto';

@Injectable()
export class ReadingsService {
    constructor(private readonly supabaseService: SupabaseService) { }

    private get supabase() {
        return this.supabaseService.getAdminClient();
    }

    // CREATE
    async create(readingData: CreateReadingDto, operatorId: string) {
        const { manual_created_at, ...restOfReadingData } = readingData;
        const finalReadingData: any = { ...restOfReadingData, operator_id: operatorId };

        if (manual_created_at) {
            const date = new Date(manual_created_at);
            const minutes = date.getUTCMinutes();

            if (minutes >= 45) {
                date.setUTCHours(date.getUTCHours() + 1);
            }
            date.setUTCMinutes(0, 0, 0);
            finalReadingData.created_at = date.toISOString();
        }

        const { data, error } = await this.supabase.from('readings').insert(finalReadingData).select().single();
        if (error) throw new InternalServerErrorException(error.message);
        return data;
    }

    // [DIUBAH] READ (Admin) dengan Logika "CHANGE"
    async findAll() {
        const { data: readings, error } = await this.supabase
            .from('readings')
            .select(`*, customers (name), profiles (username)`)
            .order('customer_code', { ascending: true })
            .order('storage_number', { ascending: true })
            .order('created_at', { ascending: true });

        if (error) throw new InternalServerErrorException(error.message);
        if (!readings || readings.length === 0) return [];

        const processedData: any[] = [];
        let currentBlock: any[] = []; // [FIXED] Tipe array didefinisikan secara eksplisit

        const processBlock = (block) => {
            if (block.length === 0) return;

            let totalFlowMeter = 0;

            const blockWithFlowMeter = block.map((reading, index) => {
                const previousReading = index > 0 ? block[index - 1] : null;
                let flowMeter = 0;
                if (previousReading) {
                    const diff = reading.flow_turbine - previousReading.flow_turbine;
                    flowMeter = diff > 0 ? diff : 0;
                }
                totalFlowMeter += flowMeter;
                return { ...reading, flowMeter };
            });

            processedData.push(...blockWithFlowMeter);

            const startTime = new Date(block[0].created_at);
            const endTime = new Date(block[block.length - 1].created_at);
            const durationMs = endTime.getTime() - startTime.getTime();
            const hours = Math.floor(durationMs / (1000 * 60 * 60));
            const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
            const totalDuration = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

            processedData.push({
                isChangeRow: true,
                customer_code: block[0].customer_code,
                customerName: block[0].customers?.name || 'N/A',
                storage_number: block[0].storage_number,
                totalFlowMeter,
                totalDuration,
            });
        };

        for (const reading of readings) {
            if (currentBlock.length === 0 || reading.storage_number === currentBlock[0].storage_number) {
                currentBlock.push(reading);
            } else {
                processBlock(currentBlock);
                currentBlock = [reading];
            }
        }

        processBlock(currentBlock);

        return processedData;
    }

    async findOne(id: number) {
        const { data, error } = await this.supabase.from('readings').select(`*, customers (name), profiles (username)`).eq('id', id).single();
        if (error) throw new InternalServerErrorException(error.message);
        if (!data) throw new NotFoundException(`Reading with ID ${id} not found.`);
        return data;
    }

    // READ (Operator)
    async findReadingsByOperator(operatorId: string) {
        const { data, error } = await this.supabase.from('readings').select(`*, customers (name)`).eq('operator_id', operatorId).order('created_at', { ascending: false }).limit(10);
        if (error) throw new InternalServerErrorException(error.message);
        return data;
    }

    // UPDATE
    async update(id: number, updateDto: UpdateReadingDto, user: any) {
        const { data: reading, error: findError } = await this.supabase.from('readings').select('operator_id, created_at').eq('id', id).single();
        if (findError || !reading) throw new NotFoundException(`Reading with ID ${id} not found.`);

        if (user.role === 'operator') {
            if (reading.operator_id !== user.id) {
                throw new ForbiddenException('You can only edit your own readings.');
            }
            const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
            if (new Date(reading.created_at) < twoHoursAgo) {
                throw new ForbiddenException('You can no longer edit this reading after 2 hours.');
            }
        }

        const { data, error } = await this.supabase.from('readings').update(updateDto).eq('id', id).select().single();
        if (error) throw new InternalServerErrorException(error.message);
        return data;
    }

    // DELETE
    async remove(id: number, user: any) {
        const { data: reading, error: findError } = await this.supabase.from('readings').select('operator_id, created_at').eq('id', id).single();
        if (findError || !reading) throw new NotFoundException(`Reading with ID ${id} not found.`);

        if (user.role === 'operator') {
            if (reading.operator_id !== user.id) {
                throw new ForbiddenException('You can only delete your own readings.');
            }
            const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
            if (new Date(reading.created_at) < twoHoursAgo) {
                throw new ForbiddenException('You can no longer delete this reading after 2 hours.');
            }
        }

        const { error } = await this.supabase.from('readings').delete().eq('id', id);
        if (error) throw new InternalServerErrorException(error.message);
    }

    // STATS (Admin)
    async getOperatorCounts() {
        const { data, error } = await this.supabase.rpc('get_operator_reading_counts');
        if (error) throw new InternalServerErrorException(error.message);
        return data;
    }
}
