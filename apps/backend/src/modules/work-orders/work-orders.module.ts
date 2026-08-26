import { Module } from '@nestjs/common';
import { MaterialTypesController, WorkOrdersController } from './work-orders.controller';
import { WorkOrdersService } from './work-orders.service';

// Owns work orders, stage events, materials, processed material, transport
// trips, photos (plan §3b). Emits WorkOrderCompletedEvent for
// EsgMetricsModule (Phase 3) to react to via EventEmitter2, not a direct
// import — see work-order-completed.event.ts.
@Module({
  controllers: [WorkOrdersController, MaterialTypesController],
  providers: [WorkOrdersService],
  exports: [WorkOrdersService],
})
export class WorkOrdersModule {}
