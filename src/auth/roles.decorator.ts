import { SetMetadata } from '@nestjs/common';

/**
 * Decorator untuk menentukan peran (roles) yang diizinkan mengakses sebuah endpoint.
 * @param roles - Daftar peran yang diizinkan (e.g., 'admin', 'operator').
 * Contoh penggunaan di controller: @Roles('admin')
 */
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
