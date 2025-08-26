import { Controller, Get, Post, Body, UseGuards, Request, Param, ParseIntPipe, Put, Delete, HttpCode } from '@nestjs/common';
import { ReadingsService } from './readings.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreateReadingDto } from './dto/create-reading.dto';
import { UpdateReadingDto } from './dto/update-reading.dto';
import { PerformDumpingDto } from './dto/perform-dumping.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Readings')
@Controller('readings')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ReadingsController {
    constructor(private readonly readingsService: ReadingsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new reading (Admin & Operator)' })
    create(@Body() createReadingDto: CreateReadingDto, @Request() req) {
        const operatorId = req.user.id;
        return this.readingsService.create(createReadingDto, operatorId);
    }

    @Post(':id/dumping')
    @ApiOperation({ summary: 'Perform a dumping (refill) process from a reading (Admin & Operator)' })
    performDumping(
        @Param('id', ParseIntPipe) sourceReadingId: number,
        @Body() dumpingDto: PerformDumpingDto,
        @Request() req,
    ) {
        const user = req.user;
        return this.readingsService.performDumping(sourceReadingId, dumpingDto, user);
    }

    @Get('summary/dumping')
    @Roles('admin')
    @ApiOperation({ summary: 'Get a summary of all dumping events (Admin Only)' })
    getDumpingSummary() {
        return this.readingsService.getDumpingSummary();
    }

    @Get('stats/operator-counts')
    @Roles('admin')
    @ApiOperation({ summary: 'Get reading counts per operator (Admin Only)' })
    getOperatorCounts() {
        return this.readingsService.getOperatorCounts();
    }

    @Get('mine')
    @Roles('operator')
    @ApiOperation({ summary: 'Get recent readings submitted by me (Operator Only)' })
    findMyReadings(@Request() req) {
        const operatorId = req.user.id;
        return this.readingsService.findReadingsByOperator(operatorId);
    }

    @Get()
    @Roles('admin')
    @ApiOperation({ summary: 'Get all readings with details & CHANGE summary (Admin Only)' })
    findAll() {
        return this.readingsService.findAll();
    }

    @Get(':id')
    @Roles('admin')
    @ApiOperation({ summary: 'Get a single reading by ID (Admin Only)' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.readingsService.findOne(id);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update a reading (Admin unrestricted, Operator limited to 2 hours)' })
    update(@Param('id', ParseIntPipe) id: number, @Body() updateReadingDto: UpdateReadingDto, @Request() req) {
        const user = req.user;
        return this.readingsService.update(id, updateReadingDto, user);
    }

    @Delete(':id')
    @HttpCode(204)
    @ApiOperation({ summary: 'Delete a reading (Admin unrestricted, Operator limited to 2 hours)' })
    remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
        const user = req.user;
        return this.readingsService.remove(id, user);
    }
}