import { Controller, Get, Headers } from '@nestjs/common';
import { getDashboardSummary } from '@templateforge/domain';
import {
  OPENROUTER_DEMO_KEY_HEADER,
  SENDBYTE_DEMO_KEY_HEADER,
  runtimeCredentialsFromHeaders,
} from '../app/runtime-credentials';

@Controller('dashboard')
export class DashboardController {
  @Get()
  async summary(
    @Headers(OPENROUTER_DEMO_KEY_HEADER) openRouterApiKey?: string,
    @Headers(SENDBYTE_DEMO_KEY_HEADER) sendByteApiKey?: string,
  ) {
    return getDashboardSummary(
      {
        credentials: runtimeCredentialsFromHeaders({
          openRouterApiKey,
          sendByteApiKey,
        }),
      } as never,
    );
  }
}
