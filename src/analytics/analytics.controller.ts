import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@Roles('admin') // Semua endpoint di sini hanya untuk admin
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get('stats')
    @ApiOperation({ summary: 'Get overall reading statistics (Admin Only)' })
    getOverallStats() {
        return this.analyticsService.getOverallStats();
    }

    @Get('readings-over-time')
    @ApiOperation({ summary: 'Get reading statistics over a time range (Admin Only)' })
    @ApiQuery({ name: 'startDate', required: true, example: '2025-08-01' })
    @ApiQuery({ name: 'endDate', required: true, example: '2025-08-31' })
    getReadingsOverTime(
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
    ) {
        return this.analyticsService.getReadingsOverTime(startDate, endDate);
    }

    @Get('readings-with-flowmeter')
    @ApiOperation({ summary: 'Get all readings with calculated flowmeter values (Admin Only)' })
    @ApiQuery({ name: 'customerCode', required: false, example: 'CUST-001', description: "Filter by customer code or 'all'" })
    getReadingsWithFlowmeter(@Query('customerCode') customerCode: string = 'all') {
        return this.analyticsService.getReadingsWithFlowmeter(customerCode);
    }

    @Get('relevant-storages')
    @ApiOperation({ summary: 'Get relevant storages (mobile and fixed for a customer) (Admin Only)' })
    @ApiQuery({ name: 'customerCode', required: true, example: 'CUST-001' })
    getRelevantStorages(@Query('customerCode') customerCode: string) {
        return this.analyticsService.getRelevantStorages(customerCode);
    }
}
