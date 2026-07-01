import { Body, Controller, Get, Headers, NotFoundException, Param, Post } from '@nestjs/common';
import {
  confirmImportJob,
  createBodyImport,
  createBrandShellImport,
  createFullEmailImport,
  getImportJob,
  listImportJobs,
  retryImportJob,
} from '@templateforge/domain';
import {
  OPENROUTER_DEMO_KEY_HEADER,
  SENDBYTE_DEMO_KEY_HEADER,
  runtimeCredentialsFromHeaders,
} from '../app/runtime-credentials';

@Controller('imports')
export class ImportsController {
  @Get('jobs')
  async jobs() {
    return listImportJobs();
  }

  @Get('jobs/:id')
  async job(@Param('id') id: string) {
    const job = await getImportJob(id);

    if (!job) {
      throw new NotFoundException('Import job not found.');
    }

    return job;
  }

  @Post('brand-shell')
  async brandShell(
    @Body() body: unknown,
    @Headers(OPENROUTER_DEMO_KEY_HEADER) openRouterApiKey?: string,
    @Headers(SENDBYTE_DEMO_KEY_HEADER) sendByteApiKey?: string,
  ) {
    return createBrandShellImport(body, {
      credentials: runtimeCredentialsFromHeaders({
        openRouterApiKey,
        sendByteApiKey,
      }),
    } as never);
  }

  @Post('body')
  async body(
    @Body() body: unknown,
    @Headers(OPENROUTER_DEMO_KEY_HEADER) openRouterApiKey?: string,
    @Headers(SENDBYTE_DEMO_KEY_HEADER) sendByteApiKey?: string,
  ) {
    return createBodyImport(body, {
      credentials: runtimeCredentialsFromHeaders({
        openRouterApiKey,
        sendByteApiKey,
      }),
    } as never);
  }

  @Post('full-email')
  async fullEmail(
    @Body() body: unknown,
    @Headers(OPENROUTER_DEMO_KEY_HEADER) openRouterApiKey?: string,
    @Headers(SENDBYTE_DEMO_KEY_HEADER) sendByteApiKey?: string,
  ) {
    return createFullEmailImport(body, {
      credentials: runtimeCredentialsFromHeaders({
        openRouterApiKey,
        sendByteApiKey,
      }),
    } as never);
  }

  @Post('jobs/:id/retry')
  async retry(
    @Param('id') id: string,
    @Headers(OPENROUTER_DEMO_KEY_HEADER) openRouterApiKey?: string,
    @Headers(SENDBYTE_DEMO_KEY_HEADER) sendByteApiKey?: string,
  ) {
    return retryImportJob(id, {
      credentials: runtimeCredentialsFromHeaders({
        openRouterApiKey,
        sendByteApiKey,
      }),
    } as never);
  }

  @Post('jobs/:id/confirm')
  async confirm(@Param('id') id: string) {
    return confirmImportJob(id);
  }
}
