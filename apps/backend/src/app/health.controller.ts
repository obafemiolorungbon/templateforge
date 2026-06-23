import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  health() {
    return {
      ok: true,
      service: 'templateforge-backend',
      mode: 'thin-facade',
    };
  }
}
