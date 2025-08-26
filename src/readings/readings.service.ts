import { Injectable, InternalServerErrorException, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateReadingDto } from './dto/create-reading.dto';
import { UpdateReadingDto } from './dto/update-reading.dto';
import { PerformDumpingDto } from './dto/perform-dumping.dto';

@Injectable()
export class ReadingsService {
    constructor(private readonly supabaseService: SupabaseService) { }

    private get supabase() {
        return this.supabaseService.getAdminClient();
    }

    // [FUNGSI BARU] Untuk menangani aksi dumping
    async performDumping(sourceReadingId: number, dumpingDto: PerformDumpingDto, user: any) {
        // 1. Ambil data reading sumber
        const { data: sourceReading, error: findError } = await this.supabase
            .from('readings')
            .select('*')
            .eq('id', sourceReadingId)
            .single();

        if (findError || !sourceReading) {
            throw new NotFoundException(`Source reading with ID ${sourceReadingId} not found.`);
        }

        // 2. Siapkan dua data reading baru untuk proses dumping
        const startDumpingReading = {
            customer_code: sourceReading.customer_code,
            storage_number: dumpingDto.dumpingStorageNumber,
            operator_id: user.id,
            psi: dumpingDto.startPsi,
            temp: sourceReading.temp, // Asumsi temp dan psi_out sama
            psi_out: sourceReading.psi_out,
            flow_turbine: sourceReading.flow_turbine, // Flow turbine belum berubah
            created_at: sourceReading.created_at, // Waktu yang sama dengan sumber
        };

        const endDumpingReading = {
            ...startDumpingReading,
            psi: dumpingDto.endPsi,
            created_at: dumpingDto.endTimestamp, // Waktu baru dari input
        };

        // 3. Masukkan kedua data baru ke database
        const { data: createdReadings, error: insertError } = await this.supabase
            .from('readings')
            .insert([startDumpingReading, endDumpingReading])
            .select();

        if (insertError) {
            throw new InternalServerErrorException(`Failed to create dumping records: ${insertError.message}`);
        }

        return createdReadings;
    }

    // CREATE
    async create(readingData: CreateReadingDto, operatorId: string) {
        const { manual_created_at, ...restOfReadingData } = readingData;
        const finalReadingData: any = { ...restOfReadingData, operator_id: operatorId };

        if (manual_created_at) {
            const date = new Date(manual_created_at);
            const minutes = date.getUTCMinutes();
            if (minutes >= 45) date.setUTCHours(date.getUTCHours() + 1);
            date.setUTCMinutes(0, 0, 0);
            finalReadingData.created_at = date.toISOString();
        }

        const { data, error } = await this.supabase.from('readings').insert(finalReadingData).select().single();
        if (error) throw new InternalServerErrorException(error.message);
        return data;
    }

    // [DISEDERHANAKAN] READ (Admin) dengan Logika "CHANGE"
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
        let currentBlock: any[] = [];

        const processBlock = (block) => {
            if (block.length === 0) return;

            let totalFlowMeter = 0;
            const blockWithFlowMeter = block.map((reading, index) => {
                const previousReading = index > 0 ? block[index - 1] : null;
                let flowMeter: number | null = null;
                if (previousReading) {
                    const diff = reading.flow_turbine - previousReading.flow_turbine;
                    flowMeter = diff > 0 ? diff : 0;
                }
                if (flowMeter !== null) totalFlowMeter += flowMeter;
                return { ...reading, flowMeter };
            });

            processedData.push(...blockWithFlowMeter);

            const startTime = new Date(block[0].created_at);
            const endTime = new Date(block[block.length - 1].created_at);
            const durationMs = endTime.getTime() - startTime.getTime();
            const hours = Math.floor(durationMs / 3600000);
            const minutes = Math.floor((durationMs % 3600000) / 60000);
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

    // ... (Fungsi lainnya tetap sama) ...
    async findOne(id: number) {
        const { data, error } = await this.supabase.from('readings').select(`*, customers (name), profiles (username)`).eq('id', id).single();
        if (error) throw new InternalServerErrorException(error.message);
        if (!data) throw new NotFoundException(`Reading with ID ${id} not found.`);
        return data;
    }

    async findReadingsByOperator(operatorId: string) {
        const { data, error } = await this.supabase.from('readings').select(`*, customers (name)`).eq('operator_id', operatorId).order('created_at', { ascending: false }).limit(10);
        if (error) throw new InternalServerErrorException(error.message);
        return data;
    }

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

    async getOperatorCounts() {
        const { data, error } = await this.supabase.rpc('get_operator_reading_counts');
        if (error) throw new InternalServerErrorException(error.message);
        return data;
    }
}
