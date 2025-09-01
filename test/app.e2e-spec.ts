import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
// FIX: Ubah cara import supertest
import request from 'supertest';
import { AppModule } from './../src/app.module';

// Catatan: Baris ini tidak lagi diperlukan setelah mengubah cara import
// import { App } from 'supertest/types'; 

describe('AppController (e2e)', () => {
  // FIX: Sederhanakan tipe INestApplication
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});