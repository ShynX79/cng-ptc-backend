import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/public.decorator'; // <-- FIX: Tambahkan baris ini

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Public() // Decorator ini sekarang sudah dikenali
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}

