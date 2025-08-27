import { Controller, Get, Post, Body, UseGuards, Request, Param, ParseIntPipe, Put, Delete, HttpCode, Query } from '@nestjs/common';
import { ReadingsService } from './readings.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CreateReadingDto } from './dto/create-reading.dto';
import { UpdateReadingDto } from './dto/update-reading.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { QueryReadingDto } from './dto/query-reading.dto';

@ApiTags('Readings')
@Controller('readings')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ReadingsController {
    constructor(private readonly readingsService: ReadingsService) { }

    private getTokenFromRequest(req): string {
        return req.headers.authorization.split(' ')[1];
    }

    @Post()
    @ApiOperation({ summary: 'Create a new reading (Admin & Operator)' })
    create(@Body() createReadingDto: CreateReadingDto, @Request() req) {
        const operatorId = req.user.id;
        const token = this.getTokenFromRequest(req);
        return this.readingsService.create({ ...createReadingDto, manual_created_at: createReadingDto.manual_created_at || new Date().toTimeString().slice(0, 5) }, operatorId, token);
    }

    @Get('stats/operator-counts')
    @Roles('admin', 'operator') // [DIUBAH]
    @ApiOperation({ summary: 'Get reading counts per operator (Admin & Operator)' })
    getOperatorCounts() {
        return this.readingsService.getOperatorCounts();
    }

    @Get('mine')
    @Roles('operator')
    @ApiOperation({ summary: 'Get recent readings submitted by me (Operator Only)' })
    findMyReadings(@Request() req) {
        const operatorId = req.user.id;
        const token = this.getTokenFromRequest(req);
        return this.readingsService.findReadingsByOperator(operatorId, token);
    }

    @Get()
    @Roles('admin', 'operator') // [DIUBAH]
    @ApiOperation({ summary: 'Get all readings with filters (Admin & Operator)' })
    @ApiQuery({ name: 'customer', required: false, type: String, description: 'Filter by customer code' })
    @ApiQuery({ name: 'operator', required: false, type: String, description: 'Filter by operator username' })
    @ApiQuery({ name: 'searchTerm', required: false, type: String, description: 'Search term' })
    @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order' })
    findAll(@Request() req, @Query() query: QueryReadingDto) {
        const token = this.getTokenFromRequest(req);
        return this.readingsService.findAll(token, query);
    }

    @Get(':id')
    @Roles('admin', 'operator') // [DIUBAH]
    @ApiOperation({ summary: 'Get a single reading by ID (Admin & Operator)' })
    findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
        const token = this.getTokenFromRequest(req);
        return this.readingsService.findOne(id, token);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update a reading (Admin unrestricted, Operator limited by RLS)' })
    update(@Param('id', ParseIntPipe) id: number, @Body() updateReadingDto: UpdateReadingDto, @Request() req) {
        const token = this.getTokenFromRequest(req);
        return this.readingsService.update(id, updateReadingDto, token);
    }

    @Delete(':id')
    @HttpCode(204)
    @ApiOperation({ summary: 'Delete a reading (Admin unrestricted, Operator limited by RLS)' })
    remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
        const token = this.getTokenFromRequest(req);
        return this.readingsService.remove(id, token);
    }
}