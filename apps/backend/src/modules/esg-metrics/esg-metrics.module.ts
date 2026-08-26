import { Module } from '@nestjs/common';
import { EsgMetricsController } from './esg-metrics.controller';
import { EsgMetricsService } from './esg-metrics.service';
import { WorkOrderCompletedListener } from './work-order-completed.listener';

// Owns the metric catalog and metric values (plan §3c). Listens to
// WorkOrdersModule's WorkOrderCompletedEvent via EventEmitter2 to
// auto-derive raw-material metrics — no direct import of WorkOrdersModule,
// only its event contract (work-order-completed.event.ts).
@Module({
  controllers: [EsgMetricsController],
  providers: [EsgMetricsService, WorkOrderCompletedListener],
  exports: [EsgMetricsService],
})
export class EsgMetricsModule {}
