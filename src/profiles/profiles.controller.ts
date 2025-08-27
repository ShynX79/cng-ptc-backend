import { Controller, Get, Param, ParseUUIDPipe, UseGuards, Request } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Profiles')
@Controller('profiles')
export class ProfilesController {
    constructor(private readonly profilesService: ProfilesService) { }

    private getTokenFromRequest(req): string {
        return req.headers.authorization.split(' ')[1];
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get a user profile by ID (Login Required)' })
    findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
        const token = this.getTokenFromRequest(req);
        return this.profilesService.findOne(id, token);
    }
}