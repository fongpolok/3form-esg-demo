import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { OrgModule } from './modules/org/org.module';
import { UsersModule } from './modules/users/users.module';
import { WorkOrdersModule } from './modules/work-orders/work-orders.module';
import { IngestionModule } from './modules/ingestion/ingestion.module';
import { EsgMetricsModule } from './modules/esg-metrics/esg-metrics.module';
import { EmissionFactorsModule } from './modules/emission-factors/emission-factors.module';
import { ReportsModule } from './modules/reports/reports.module';
import { StorageModule } from './modules/storage/storage.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { TenantScopeGuard } from './common/guards/tenant-scope.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    PrismaModule,
    HealthModule,
    AuthModule,
    OrgModule,
    UsersModule,
    WorkOrdersModule,
    IngestionModule,
    EsgMetricsModule,
    EmissionFactorsModule,
    ReportsModule,
    StorageModule,
  ],
  providers: [
    // Order matters — each guard in this chain depends on the previous one
    // having already populated the request: JwtAuthGuard sets req.user (or
    // no-ops on @Public() routes), TenantScopeGuard reads req.user to set
    // req.scope, RolesGuard reads req.user's memberships against @Roles().
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: TenantScopeGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
