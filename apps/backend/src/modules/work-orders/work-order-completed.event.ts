// Emitted when a work order's processed material is recorded (the WIP
// Completion step in the PPT's flow). EsgMetricsModule (Phase 3) will listen
// for this via NestJS's EventEmitter2 to auto-derive raw-material metric
// values — deliberately a plain event class with no import of
// EsgMetricsModule, so WorkOrdersModule stays decoupled from it (plan §4).
export const WORK_ORDER_COMPLETED_EVENT = 'work-order.completed';

export class WorkOrderCompletedEvent {
  constructor(
    public readonly workOrderId: string,
    public readonly facilityId: string,
    public readonly clientId: string | null,
  ) {}
}
