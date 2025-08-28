import { Controller, Get, Post, Body, UseGuards, Request, Param, ParseIntPipe, Put, Delete, HttpCode, Query } from '@nestjs/common';
import { ReadingsService } from './readings.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CreateReadingDto } from './dto/create-reading.dto';
import { UpdateReadingDto } from './dto/update-reading.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { QueryReadingDto } from './dto/query-reading.dto';
import { CreateDumpingDto } from './dto/create-dumping.dto';
import { CreateChangeDto } from './dto/create-change.dto';

@ApiTags('Readings')
@Controller('readings')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ReadingsController {
    constructor(private readonly readingsService: ReadingsService) { }

    private getTokenFromRequest(req: any): string {
        return req.headers.authorization.split(' ')[1];
    }

    // Endpoint untuk entri pembacaan normal
    @Post()
    @ApiOperation({ summary: 'Create a new standard reading' })
    create(@Body() createReadingDto: CreateReadingDto, @Request() req: any) {
        const operatorId = req.user.id;
        const token = this.getTokenFromRequest(req);
        return this.readingsService.create(createReadingDto, operatorId, token);
    }

    // Endpoint KHUSUS untuk proses DUMPING
    @Post('dumping')
    @Roles('admin', 'operator')
    @ApiOperation({ summary: 'Record a dumping (gas transfer) process' })
    createDumping(@Body() createDumpingDto: CreateDumpingDto, @Request() req: any) {
        const operatorId = req.user.id;
        const token = this.getTokenFromRequest(req);
        return this.readingsService.createDumping(createDumpingDto, operatorId, token);
    }

    // Endpoint KHUSUS untuk proses CHANGE (Pergantian Storage)
    @Post('change')
    @Roles('admin', 'operator')
    @ApiOperation({ summary: 'Record a storage change process' })
    createChange(@Body() createChangeDto: CreateChangeDto, @Request() req: any) {
        const operatorId = req.user.id;
        const token = this.getTokenFromRequest(req);
        return this.readingsService.createChange(createChangeDto, operatorId, token);
    }

    @Get('stats/operator-counts')
    @Roles('admin', 'operator')
    @ApiOperation({ summary: 'Get reading counts per operator' })
    getOperatorCounts() {
        return this.readingsService.getOperatorCounts();
    }

    @Get('mine')
    @Roles('operator')
    @ApiOperation({ summary: 'Get recent readings submitted by the current operator' })
    findMyReadings(@Request() req: any) {
        const operatorId = req.user.id;
        const token = this.getTokenFromRequest(req);
        return this.readingsService.findReadingsByOperator(operatorId, token);
    }

    @Get()
    @Roles('admin', 'operator')
    @ApiOperation({ summary: 'Get all readings with filters' })
    @ApiQuery({ name: 'customer', required: false, type: String })
    @ApiQuery({ name: 'operator', required: false, type: String })
    @ApiQuery({ name: 'searchTerm', required: false, type: String })
    @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
    findAll(@Request() req: any, @Query() query: QueryReadingDto) {
        const token = this.getTokenFromRequest(req);
        return this.readingsService.findAll(token, query);
    }

    @Get(':id')
    @Roles('admin', 'operator')
    @ApiOperation({ summary: 'Get a single reading by ID' })
    findOne(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
        const token = this.getTokenFromRequest(req);
        return this.readingsService.findOne(id, token);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update a reading' })
    update(@Param('id', ParseIntPipe) id: number, @Body() updateReadingDto: UpdateReadingDto, @Request() req: any) {
        const token = this.getTokenFromRequest(req);
        return this.readingsService.update(id, updateReadingDto, token);
    }

    @Delete(':id')
    @HttpCode(204)
    @ApiOperation({ summary: 'Delete a reading' })
    remove(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
        const token = this.getTokenFromRequest(req);
        return this.readingsService.remove(id, token);
    }
}
