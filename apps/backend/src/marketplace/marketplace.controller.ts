import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import {
  getMarketplaceTemplate,
  importMarketplaceTemplate,
  listMarketplaceTemplates,
} from '@templateforge/domain';

@Controller('marketplace/templates')
export class MarketplaceController {
  @Get()
  async list() {
    return listMarketplaceTemplates();
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    try {
      return await getMarketplaceTemplate(id);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Marketplace template not found.';
      throw new NotFoundException(message);
    }
  }

  @Post(':id/import')
  async importTemplate(@Param('id') id: string) {
    try {
      return await importMarketplaceTemplate(id);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Marketplace import failed.';
      throw new BadRequestException(message);
    }
  }
}
