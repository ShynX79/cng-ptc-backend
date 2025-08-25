import { Controller, Get, Post, Body, Param, Delete, Put, ParseIntPipe, UseGuards, HttpCode } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Customers')
@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard) // Terapkan guard login dan peran
@ApiBearerAuth('JWT-auth')
@Roles('admin') // <-- HANYA ADMIN YANG BISA MENGAKSES SEMUA ENDPOINT DI CONTROLLER INI
export class CustomersController {
    constructor(private readonly customersService: CustomersService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new customer (Admin Only)' })
    create(@Body() createCustomerDto: CreateCustomerDto) {
        return this.customersService.create(createCustomerDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all customers (Admin Only)' })
    findAll() {
        return this.customersService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a customer by ID (Admin Only)' })
    findOneById(@Param('id', ParseIntPipe) id: number) {
        return this.customersService.findOneById(id);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update a customer by ID (Admin Only)' })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateCustomerDto: UpdateCustomerDto,
    ) {
        return this.customersService.update(id, updateCustomerDto);
    }

    @Delete(':id')
    @HttpCode(204)
    @ApiOperation({ summary: 'Delete a customer by ID (Admin Only)' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.customersService.remove(id);
    }

    @Get('test/connection') // Mengubah path agar lebih jelas
    @ApiOperation({ summary: 'Test Supabase connection (Admin Only)' })
    async testSupabase() {
        return this.customersService.testConnection();
    }
}
