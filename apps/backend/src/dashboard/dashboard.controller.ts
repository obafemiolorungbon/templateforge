import { Controller, Get, Headers } from '@nestjs/common';
import { getDashboardSummary } from '@templateforge/domain';
import {
  CENCORI_DEMO_KEY_HEADER,
  OPENROUTER_DEMO_KEY_HEADER,
  SENDBYTE_DEMO_KEY_HEADER,
  runtimeCredentialsFromHeaders,
} from '../app/runtime-credentials';

@Controller('dashboard')
export class DashboardController {
  @Get()
  async summary(
    @Headers(OPENROUTER_DEMO_KEY_HEADER) openRouterApiKey?: string,
    @Headers(CENCORI_DEMO_KEY_HEADER) cencoriApiKey?: string,
    @Headers(SENDBYTE_DEMO_KEY_HEADER) sendByteApiKey?: string,
  ) {
    return getDashboardSummary({
      credentials: runtimeCredentialsFromHeaders({
        openRouterApiKey,
        cencoriApiKey,
        sendByteApiKey,
      }),
    } as never);
  }
}
