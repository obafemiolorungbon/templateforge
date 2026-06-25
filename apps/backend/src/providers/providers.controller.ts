import { Controller, Get, Headers } from '@nestjs/common';
import { listEmailProviders } from '@templateforge/domain';
import {
  OPENROUTER_DEMO_KEY_HEADER,
  SENDBYTE_DEMO_KEY_HEADER,
  runtimeCredentialsFromHeaders,
} from '../app/runtime-credentials';

@Controller('providers')
export class ProvidersController {
  @Get()
  async list(
    @Headers(OPENROUTER_DEMO_KEY_HEADER) openRouterApiKey?: string,
    @Headers(SENDBYTE_DEMO_KEY_HEADER) sendByteApiKey?: string,
  ) {
    return listEmailProviders(
      {
        credentials: runtimeCredentialsFromHeaders({
          openRouterApiKey,
          sendByteApiKey,
        }),
      } as never,
    );
  }
}
