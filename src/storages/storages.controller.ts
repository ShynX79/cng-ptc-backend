import { Controller, Get, Post, Body, Param, UseGuards, Put, Delete, ParseIntPipe, HttpCode } from '@nestjs/common';
import { StoragesService } from './storages.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreateStorageDto } from './dto/create-storage.dto';
import { UpdateStorageDto } from './dto/update-storage.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Storages')
@Controller('storages')
@UseGuards(JwtAuthGuard, RolesGuard) // Terapkan guard login dan peran
@ApiBearerAuth('JWT-auth')
@Roles('admin') // <-- HANYA ADMIN YANG BISA MENGAKSES SEMUA ENDPOINT DI CONTROLLER INI
export class StoragesController {
    constructor(private readonly storagesService: StoragesService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new storage (Admin Only)' })
    create(@Body() createStorageDto: CreateStorageDto) {
        return this.storagesService.create(createStorageDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all storages (Admin Only)' })
    findAll() {
        return this.storagesService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a storage by its ID (Admin Only)' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.storagesService.findOneById(id);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update a storage (Admin Only)' })
    update(@Param('id', ParseIntPipe) id: number, @Body() updateStorageDto: UpdateStorageDto) {
        return this.storagesService.update(id, updateStorageDto);
    }

    @Delete(':id')
    @HttpCode(204)
    @ApiOperation({ summary: 'Delete a storage (Admin Only)' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.storagesService.remove(id);
    }
}
