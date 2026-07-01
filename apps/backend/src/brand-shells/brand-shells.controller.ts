import { Body, Controller, Get, NotFoundException, Param, Patch } from '@nestjs/common';
import {
  getBrandShell,
  listBrandShells,
  updateBrandShell,
} from '@templateforge/domain';

@Controller('brand-shells')
export class BrandShellsController {
  @Get()
  async list() {
    return listBrandShells();
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    const shell = await getBrandShell(id);

    if (!shell) {
      throw new NotFoundException('Brand Shell not found.');
    }

    return shell;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: unknown) {
    return updateBrandShell(id, body);
  }
}
