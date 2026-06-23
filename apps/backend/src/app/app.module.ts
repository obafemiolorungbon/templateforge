import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BrandController } from '../brand/brand.controller';
import { DashboardController } from '../dashboard/dashboard.controller';
import { MarketplaceController } from '../marketplace/marketplace.controller';
import { ProvidersController } from '../providers/providers.controller';
import { TemplatesController } from '../templates/templates.controller';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [
    HealthController,
    DashboardController,
    TemplatesController,
    BrandController,
    MarketplaceController,
    ProvidersController,
  ],
})
export class AppModule {}
