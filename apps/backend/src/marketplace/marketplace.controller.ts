import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import {
  getMarketplacePack,
  getMarketplaceTemplate,
  importMarketplacePack,
  importMarketplaceTemplate,
  listMarketplacePacks,
  listMarketplaceTemplates,
} from '@templateforge/domain';

@Controller('marketplace')
export class MarketplaceController {
  @Get('templates')
  async list() {
    return listMarketplaceTemplates();
  }

  @Get('templates/:id')
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

  @Post('templates/:id/import')
  async importTemplate(@Param('id') id: string) {
    try {
      return await importMarketplaceTemplate(id);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Marketplace import failed.';
      throw new BadRequestException(message);
    }
  }

  @Get('packs')
  async listPacks() {
    return listMarketplacePacks();
  }

  @Get('packs/:id')
  async packDetail(@Param('id') id: string) {
    try {
      return await getMarketplacePack(id);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Marketplace pack not found.';
      throw new NotFoundException(message);
    }
  }

  @Post('packs/:id/import')
  async importPack(@Param('id') id: string, @Body() body: unknown) {
    try {
      return await importMarketplacePack(id, body);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Marketplace pack import failed.';
      throw new BadRequestException(message);
    }
  }
}
