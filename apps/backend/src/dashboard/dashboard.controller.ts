import { Controller, Get } from '@nestjs/common';
import { getDashboardSummary } from '@templateforge/domain';

@Controller('dashboard')
export class DashboardController {
  @Get()
  async summary() {
    return getDashboardSummary();
  }
}
