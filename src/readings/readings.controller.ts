import {
    Controller,
    Get,
    Post,
    Body,
    UseGuards,
    Request,
    ParseIntPipe,
    Put,
    Delete,
    HttpCode,
    Query,
    Param,
} from '@nestjs/common';
import { ReadingsService } from './readings.service';
import {
    ApiTags,
    ApiOperation,
    ApiBearerAuth,
    ApiQuery,
    ApiParam,
} from '@nestjs/swagger';
import { CreateReadingDto } from './dto/create-reading.dto';
import { UpdateReadingDto } from './dto/update-reading.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { QueryReadingDto } from './dto/query-reading.dto';
import { CreateDumpingDto } from './dto/dumping-reading.dto';

@ApiTags('Readings')
@Controller('readings')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ReadingsController {
    constructor(private readonly readingsService: ReadingsService) { }

    private getTokenFromRequest(req: any): string {
        return req.headers.authorization.split(' ')[1];
    }

    // --- ENDPOINT BARU UNTUK DATA YANG SUDAH DIPROSES ---
    @Get('processed/:customerCode')
    @Roles('admin', 'operator')
    @ApiOperation({ summary: 'Get table-ready processed readings for a specific customer' })
    @ApiParam({ name: 'customerCode', description: 'The customer code to fetch and process data for', example: 'CUST-001' })
    findProcessedReadings(
        @Request() req: any,
        @Param('customerCode') customerCode: string,
    ) {
        const token = this.getTokenFromRequest(req);
        return this.readingsService.getProcessedReadingsByCustomer(token, customerCode);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new standard reading' })
    create(@Body() createReadingDto: CreateReadingDto, @Request() req: any) {
        const operatorId = req.user.id;
        const token = this.getTokenFromRequest(req);
        return this.readingsService.create(createReadingDto, operatorId, token);
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

    @Put(':id')
    @ApiOperation({ summary: 'Update a reading' })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateReadingDto: UpdateReadingDto,
        @Request() req: any,
    ) {
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

    @Delete('all')
    @Roles('admin')
    @HttpCode(204)
    @ApiOperation({ summary: 'Delete all readings (Admin Only)' })
    removeAll(@Request() req: any) {
        const token = this.getTokenFromRequest(req);
        return this.readingsService.removeAll(token);
    }

     @Post('dumping')
    @ApiOperation({ summary: 'Create new readings from a dumping operation' })
    createDumping(@Body() createDumpingDto: CreateDumpingDto, @Request() req: any) {
        const operatorId = req.user.id;
        const token = this.getTokenFromRequest(req);
        return this.readingsService.createDumping(createDumpingDto, operatorId, token);
    }
}

