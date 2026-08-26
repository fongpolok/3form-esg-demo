import { Module } from '@nestjs/common';
import { EmissionFactorsModule } from '../emission-factors/emission-factors.module';
import { StorageModule } from '../storage/storage.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportBuilderService } from './report-builder.service';

// Owns report templates, report generation, and the Auditor finalize
// workflow (plan §6). Composes EmissionFactorResolverService and
// StorageService — both exported by their own modules — rather than
// reaching into their internals.
@Module({
  imports: [EmissionFactorsModule, StorageModule],
  controllers: [ReportsController],
  providers: [ReportsService, ReportBuilderService],
})
export class ReportsModule {}
