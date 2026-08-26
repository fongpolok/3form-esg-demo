import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentScope } from '../../common/decorators/current-scope.decorator';
import type { TenantScope } from '../../common/types/authenticated-user';
import { OrgService } from './org.service';

@ApiTags('org')
@ApiBearerAuth()
@Controller('org')
export class OrgController {
  constructor(private readonly orgService: OrgService) {}

  @Get('suppliers')
  listSuppliers(@CurrentScope() scope: TenantScope) {
    return this.orgService.listSuppliers(scope);
  }

  @Post('suppliers')
  @Roles('AUDITOR')
  createSupplier(@Body() body: { name_en: string; name_zh: string; brn?: string }) {
    return this.orgService.createSupplier(body);
  }

  @Get('facilities')
  listFacilities(@CurrentScope() scope: TenantScope) {
    return this.orgService.listFacilities(scope);
  }

  @Post('facilities')
  @Roles('AUDITOR', 'SUPPLIER_ADMIN')
  createFacility(
    @Body()
    body: {
      supplier_id: string;
      name_en: string;
      name_zh: string;
      address_en?: string;
      address_zh?: string;
      gfa_sqm?: number;
    },
    @CurrentScope() scope: TenantScope,
  ) {
    return this.orgService.createFacility(body, scope);
  }

  @Get('clients')
  listClients(@CurrentScope() scope: TenantScope) {
    return this.orgService.listClients(scope);
  }

  @Post('clients')
  @Roles('AUDITOR', 'SUPPLIER_ADMIN')
  createClient(
    @Body() body: { supplier_id: string; name_en: string; name_zh: string; contact_email?: string },
    @CurrentScope() scope: TenantScope,
  ) {
    return this.orgService.createClient(body, scope);
  }

  @Post('memberships')
  @Roles('AUDITOR')
  createMembership(
    @Body()
    body: {
      user_id: string;
      role: 'AUDITOR' | 'SUPPLIER_ADMIN' | 'SUPPLIER_STAFF' | 'CLIENT_USER';
      scope_type: 'GLOBAL' | 'SUPPLIER' | 'FACILITY' | 'CLIENT';
      scope_id?: string;
    },
  ) {
    return this.orgService.createMembership(body);
  }
}
