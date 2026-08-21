import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppController } from './../src/app.controller';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';

/**
 * HTTP-layer e2e for the public health surface.
 *
 * This intentionally boots only AppController with the same global configuration as
 * `main.ts` instead of the full AppModule, so the suite runs in CI without a live
 * MongoDB instance. Route-level suites for auth/tasks belong in a separate config
 * backed by a throwaway database.
 */
describe('Health (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health returns a healthy payload', async () => {
    const res = await request(app.getHttpServer()).get('/api/health').expect(200);

    const body = res.body as { ok: boolean; service: string; stack: string; time: string };
    expect(body).toMatchObject({ ok: true, service: 'taskflow-api', stack: 'nestjs' });
    expect(typeof body.time).toBe('string');
    expect(Number.isNaN(Date.parse(body.time))).toBe(false);
  });

  it('serves everything under the /api prefix', () => {
    return request(app.getHttpServer()).get('/health').expect(404);
  });

  it('normalizes unknown routes through HttpExceptionFilter', async () => {
    const res = await request(app.getHttpServer()).get('/api/does-not-exist').expect(404);

    const body = res.body as { statusCode: number; path: string; timestamp: string };
    expect(body).toMatchObject({ statusCode: 404, path: '/api/does-not-exist' });
    expect(typeof body.timestamp).toBe('string');
  });
});
