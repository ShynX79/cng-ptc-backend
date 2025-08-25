// ================================================================
// FILE: src/auth/roles.guard.ts
// ================================================================
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
    // Meng-inject Reflector untuk membaca metadata dari decorator.
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        // Mengambil daftar peran yang diizinkan dari decorator @Roles() pada endpoint.
        const allowedRoles = this.reflector.get<string[]>('roles', context.getHandler());
        if (!allowedRoles) {
            return true; // Jika tidak ada decorator @Roles, akses diizinkan.
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user; // Informasi pengguna didapat dari JwtAuthGuard.

        // Memeriksa apakah peran pengguna termasuk dalam daftar yang diizinkan.
        if (!user || !allowedRoles.includes(user.role)) {
            throw new ForbiddenException('Anda tidak memiliki hak akses untuk sumber daya ini');
        }

        return true;
    }
}