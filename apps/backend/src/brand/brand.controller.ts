import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import {
  createBrandComponent,
  getBrandWorkspace,
  listBrandComponents,
  setDefaultBrandComponent,
  updateBrandComponent,
  updateBrandProfile,
} from '@templateforge/domain';

@Controller('brand')
export class BrandController {
  @Get()
  async workspace() {
    return getBrandWorkspace();
  }

  @Patch(':id')
  async updateProfile(@Param('id') id: string, @Body() body: unknown) {
    return updateBrandProfile(id, body);
  }

  @Get(':id/components')
  async components(@Param('id') id: string) {
    return listBrandComponents(id);
  }

  @Post(':id/components')
  async createComponent(@Param('id') id: string, @Body() body: unknown) {
    return createBrandComponent(id, body);
  }

  @Patch('components/:id')
  async updateComponent(@Param('id') id: string, @Body() body: unknown) {
    return updateBrandComponent(id, body);
  }

  @Post('components/:id/set-default')
  async setDefault(@Param('id') id: string) {
    return setDefaultBrandComponent(id);
  }
}
