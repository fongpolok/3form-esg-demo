import { Module } from '@nestjs/common';
import { OrgController } from './org.controller';
import { OrgService } from './org.service';
import { TenantScopeService } from './tenant-scope.service';

@Module({
  controllers: [OrgController],
  providers: [OrgService, TenantScopeService],
  exports: [TenantScopeService],
})
export class OrgModule {}
