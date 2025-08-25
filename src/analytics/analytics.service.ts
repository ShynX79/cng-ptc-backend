import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AnalyticsService {
    constructor(private readonly supabaseService: SupabaseService) { }

    private get supabase() {
        return this.supabaseService.getAdminClient();
    }

    async getReadingsOverTime(startDate: string, endDate: string) {
        const { data, error } = await this.supabase.rpc('get_readings_over_time', {
            start_date: startDate,
            end_date: endDate,
        });

        if (error) {
            throw new InternalServerErrorException(error.message);
        }
        return data;
    }

    async getReadingsWithFlowmeter(customerCode: string) {
        const { data, error } = await this.supabase.rpc('get_readings_with_flowmeter', {
            customer_code_param: customerCode,
        });

        if (error) {
            throw new InternalServerErrorException(error.message);
        }
        return data;
    }

    async getRelevantStorages(customerCode: string) {
        const { data, error } = await this.supabase.rpc('get_relevant_storages', {
            customer_code_param: customerCode,
        });

        if (error) {
            throw new InternalServerErrorException(error.message);
        }
        return data;
    }
}
