import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  Request,
} from '@nestjs/common'; // <-- Tambahkan 'Request'
import { CustomersService } from './customers.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Customers')
@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@Roles('admin')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  private getTokenFromRequest(req): string {
    return req.headers.authorization.split(' ')[1];
  }

  @Post()
  @ApiOperation({ summary: 'Create a new customer (Admin Only)' })
  create(@Body() createCustomerDto: CreateCustomerDto, @Request() req) {
    const token = this.getTokenFromRequest(req);
    return this.customersService.create(createCustomerDto, token);
  }

  @Get()
  @ApiOperation({ summary: 'Get all customers (Admin Only)' })
  findAll(@Request() req) {
    const token = this.getTokenFromRequest(req);
    return this.customersService.findAll(token);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a customer by ID (Admin Only)' })
  findOneById(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const token = this.getTokenFromRequest(req);
    return this.customersService.findOneById(id, token);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a customer by ID (Admin Only)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCustomerDto: UpdateCustomerDto,
    @Request() req,
  ) {
    const token = this.getTokenFromRequest(req);
    return this.customersService.update(id, updateCustomerDto, token);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a customer by ID (Admin Only)' })
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const token = this.getTokenFromRequest(req);
    return this.customersService.remove(id, token);
  }

  @Get('test/connection')
  @ApiOperation({ summary: 'Test Supabase connection (Admin Only)' })
  async testSupabase(@Request() req) {
    const token = this.getTokenFromRequest(req);
    return this.customersService.testConnection(token);
  }
}
