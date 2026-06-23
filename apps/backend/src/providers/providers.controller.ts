import { Controller, Get } from '@nestjs/common';
import { listEmailProviders } from '@templateforge/domain';

@Controller('providers')
export class ProvidersController {
  @Get()
  async list() {
    return listEmailProviders();
  }
}
