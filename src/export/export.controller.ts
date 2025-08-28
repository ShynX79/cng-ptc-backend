// src/export/export.controller.ts

import { Controller, Get, Query, Res, UseGuards, Request } from '@nestjs/common';
import { ExportService } from './export.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import type { Response } from 'express';

@ApiTags('Export')
@Controller('export')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ExportController {
    constructor(private readonly exportService: ExportService) { }

    private getTokenFromRequest(req: any): string {
        return req.headers.authorization.split(' ')[1];
    }

    @Get('readings')
    @ApiQuery({ name: 'startDate', required: true, type: String, description: 'Start date (YYYY-MM-DD)' })
    @ApiQuery({ name: 'endDate', required: true, type: String, description: 'End date (YYYY-MM-DD)' })
    async exportReadings(
        @Request() req: any,
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
        @Res() res: Response,
    ) {
        const token = this.getTokenFromRequest(req);
        const fileBuffer = await this.exportService.generateReadingsReport(token, startDate, endDate);

        const fileName = `Laporan-Bulanan-${new Date().toISOString().split("T")[0]}.xlsm`;

        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', 'application/vnd.ms-excel.sheet.macroEnabled.12');
        res.send(fileBuffer);
    }
}
