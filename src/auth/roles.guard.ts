import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const allowedRoles = this.reflector.get<string[]>('roles', context.getHandler());
        if (!allowedRoles) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;
        
        if (!user || !allowedRoles.includes(user.role)) {
            throw new ForbiddenException('Anda tidak memiliki hak akses untuk sumber daya ini');
        }

        return true;
    }
}