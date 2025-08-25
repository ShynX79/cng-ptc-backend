import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Profiles')
@Controller('profiles')
export class ProfilesController {
    constructor(private readonly profilesService: ProfilesService) { }

    @Get(':id')
    @UseGuards(JwtAuthGuard) // <-- DITAMBAHKAN
    @ApiBearerAuth('JWT-auth') // <-- DITAMBAHKAN
    @ApiOperation({ summary: 'Get a user profile by ID (Login Required)' })
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.profilesService.findOne(id);
    }
}
