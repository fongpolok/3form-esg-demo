import { Module } from '@nestjs/common';
import { EmissionFactorsController } from './emission-factors.controller';
import { EmissionFactorsService } from './emission-factors.service';
import { EmissionFactorResolverService } from './emission-factor-resolver.service';

// Owns the versioned, effective-dated emission-factor/parameter table.
// EmissionFactorResolverService.resolve(category, scope, asOfDate) is the
// only entry point other modules use (plan §3d) — this is the "tunable
// parameters" requirement made concrete.
@Module({
  controllers: [EmissionFactorsController],
  providers: [EmissionFactorsService, EmissionFactorResolverService],
  exports: [EmissionFactorResolverService],
})
export class EmissionFactorsModule {}
