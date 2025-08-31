import {
    Controller, Get, Post, Body, Param, ParseUUIDPipe, UseGuards, Request, Put, Delete, HttpCode
} from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('Profiles')
@Controller('profiles')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ProfilesController {
    constructor(private readonly profilesService: ProfilesService) { }

    private getTokenFromRequest(req): string {
        return req.headers.authorization.split(' ')[1];
    }

    @Post()
    @Roles('admin')
    @ApiOperation({ summary: 'Create a new user profile (Admin or Operator) (Admin Only)' })
    create(@Body() createProfileDto: CreateProfileDto) {
        return this.profilesService.create(createProfileDto);
    }

    @Get()
    @Roles('admin')
    @ApiOperation({ summary: 'Get all user profiles (Admin Only)' })
    findAll(@Request() req) {
        const token = this.getTokenFromRequest(req);
        return this.profilesService.findAll(token);
    }

    @Put(':id')
    @Roles('admin')
    @ApiOperation({ summary: 'Update a user profile (Admin Only)' })
    update(@Param('id', ParseUUIDPipe) id: string, @Body() updateProfileDto: UpdateProfileDto, @Request() req) {
        const token = this.getTokenFromRequest(req);
        return this.profilesService.update(id, updateProfileDto, token);
    }

    @Delete(':id')
    @HttpCode(204)
    @Roles('admin')
    @ApiOperation({ summary: 'Delete a user profile (Admin Only)' })
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.profilesService.remove(id);
    }
}