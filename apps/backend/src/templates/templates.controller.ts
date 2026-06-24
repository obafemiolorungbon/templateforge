import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  deployTemplate,
  generateTemplate,
  getTemplate,
  getTemplateCodeSamples,
  listTemplates,
  previewTemplate,
  updateTemplate,
} from '@templateforge/domain';
import { DeployTemplateInputSchema } from '@templateforge/shared-types';

@Controller('templates')
export class TemplatesController {
  @Get()
  async list() {
    return listTemplates();
  }

  @Post('generate')
  async generate(@Body() body: unknown) {
    return generateTemplate(body);
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    const template = await getTemplate(id);

    if (!template) {
      throw new NotFoundException('Template not found.');
    }

    return template;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: unknown) {
    return updateTemplate(id, body);
  }

  @Post(':id/preview/providers/:providerId')
  async preview(@Param('id') id: string, @Param('providerId') providerId: string) {
    return previewTemplate(id, providerId);
  }

  @Get(':id/code-samples/providers/:providerId')
  async codeSamples(
    @Param('id') id: string,
    @Param('providerId') providerId: string,
  ) {
    return getTemplateCodeSamples(id, providerId);
  }

  @Post(':id/deploy/providers/:providerId')
  async deploy(
    @Param('id') id: string,
    @Param('providerId') providerId: string,
    @Body() body: unknown,
  ) {
    const input = DeployTemplateInputSchema.parse(body ?? {});
    return deployTemplate(id, providerId, input.mode);
  }
}
