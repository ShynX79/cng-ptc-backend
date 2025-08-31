import { Controller, Get, Post, Body, Param, UseGuards, Put, Delete, ParseIntPipe, HttpCode, Request } from '@nestjs/common';
import { StoragesService } from './storages.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreateStorageDto } from './dto/create-storage.dto';
import { UpdateStorageDto } from './dto/update-storage.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Storages')
@Controller('storages')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@Roles('admin')
export class StoragesController {
    constructor(private readonly storagesService: StoragesService) { }

    private getTokenFromRequest(req): string {
        return req.headers.authorization.split(' ')[1];
    }

    @Post()
    @ApiOperation({ summary: 'Create a new storage (Admin Only)' })
    create(@Body() createStorageDto: CreateStorageDto, @Request() req) {
        const token = this.getTokenFromRequest(req);
        return this.storagesService.create(createStorageDto, token);
    }

    @Get()
    @ApiOperation({ summary: 'Get all storages (Admin & Operator)' })
    @Roles('admin', 'operator')
    findAll(@Request() req) {
        const token = this.getTokenFromRequest(req);
        return this.storagesService.findAll(token);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a storage by its ID (Admin Only)' })
    findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
        const token = this.getTokenFromRequest(req);
        return this.storagesService.findOneById(id, token);
    }

    @Get('relevant/:customerCode')
    @Roles('admin', 'operator')
    @ApiOperation({ summary: 'Get relevant storages for an operator (Admin & Operator)' })
    findRelevantStorages(@Param('customerCode') customerCode: string, @Request() req) {
        const token = this.getTokenFromRequest(req);
        return this.storagesService.findRelevantForOperator(customerCode, token);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update a storage (Admin Only)' })
    update(@Param('id', ParseIntPipe) id: number, @Body() updateStorageDto: UpdateStorageDto, @Request() req) {
        const token = this.getTokenFromRequest(req);
        return this.storagesService.update(id, updateStorageDto, token);
    }

    @Delete(':id')
    @HttpCode(204)
    @ApiOperation({ summary: 'Delete a storage (Admin Only)' })
    remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
        const token = this.getTokenFromRequest(req);
        return this.storagesService.remove(id, token);
    }
}