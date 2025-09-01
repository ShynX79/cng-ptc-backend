import { SetMetadata } from '@nestjs/common';

/**
 * Kunci metadata yang digunakan untuk mengidentifikasi endpoint publik.
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator @Public() untuk menandai sebuah endpoint agar dapat diakses
 * tanpa memerlukan token otentikasi (JWT).
 * AuthGuard akan memeriksa metadata ini.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

