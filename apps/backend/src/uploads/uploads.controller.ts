import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import {
  completeUpload,
  createPresignedUpload,
  deleteAsset,
} from '@templateforge/domain';

@Controller()
export class UploadsController {
  @Post('uploads/presign')
  async presign(@Body() body: unknown) {
    return createPresignedUpload(body);
  }

  @Post('uploads/complete')
  async complete(@Body() body: unknown) {
    return completeUpload(body);
  }

  @Delete('assets/:id')
  async delete(@Param('id') id: string) {
    return deleteAsset(id);
  }
}
