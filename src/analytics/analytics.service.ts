import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AnalyticsService {
    constructor(private readonly supabaseService: SupabaseService) { }

    private get supabase() {
        return this.supabaseService.getAdminClient();
    }

    async getOverallStats() {
        // Ambil semua data readings menggunakan admin client
        const { data: readings, error } = await this.supabase
            .from('readings')
            .select('psi, temp, flow_turbine, customer_code');

        if (error) {
            throw new InternalServerErrorException(error.message);
        }

        if (!readings || readings.length === 0) {
            return {
                totalReadings: 0,
                avgPSI: 0,
                avgTemp: 0,
                avgFlow: 0,
                topCustomers: [],
            };
        }

        // Lakukan kalkulasi di backend
        const totalPSI = readings.reduce((sum, r) => sum + Number(r.psi), 0);
        const totalTemp = readings.reduce((sum, r) => sum + Number(r.temp), 0);
        const totalFlow = readings.reduce((sum, r) => sum + Number(r.flow_turbine), 0);

        const customerCounts = readings.reduce((acc, r) => {
            acc[r.customer_code] = (acc[r.customer_code] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const topCustomers = Object.entries(customerCounts)
            .map(([customer, readings]) => ({ customer, readings }))
            .sort((a, b) => b.readings - a.readings)
            .slice(0, 5);

        return {
            totalReadings: readings.length,
            avgPSI: parseFloat((totalPSI / readings.length).toFixed(1)),
            avgTemp: parseFloat((totalTemp / readings.length).toFixed(1)),
            avgFlow: parseFloat((totalFlow / readings.length).toFixed(1)),
            topCustomers: topCustomers,
        };
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
