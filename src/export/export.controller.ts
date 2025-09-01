// src/export/export.controller.ts

import { Controller, Get, Query, Res, UseGuards, Request } from '@nestjs/common';
import { ExportService } from './export.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import type { Response } from 'express';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Export')
@Controller('export')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ExportController {
    constructor(private readonly exportService: ExportService) { }

    private getTokenFromRequest(req: any): string {
        return req.headers.authorization.split(' ')[1];
    }

    @Get('readings')
    @Roles('admin')
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

        // FIX: Menggunakan nama file dan tipe konten untuk .xlsx
        const fileName = `Laporan-Bulanan-${new Date().toISOString().split("T")[0]}.xlsx`;

        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        // FIX: Tipe konten yang benar untuk file .xlsx modern
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(fileBuffer);
    }
}
