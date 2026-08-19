import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  health() {
    return { ok: true, service: 'taskflow-api', stack: 'nestjs', time: new Date().toISOString() };
  }
}
