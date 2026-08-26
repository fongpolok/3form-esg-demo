import type { WorkOrderStatus } from '@esg/shared-types';

// Maps work order status -> the WCAG-corrected status token pairs from
// packages/ui/src/tokens.ts (dark text on a light tint, not white text on
// the raw Figma accent — see that file's comments for why).
const STATUS_STYLES: Record<WorkOrderStatus, { bg: string; fg: string; label: string }> = {
  ORDER_RECEIVED: { bg: 'var(--color-status-info-bg)', fg: 'var(--color-status-info-fg)', label: 'Order Received' },
  PICKUP_SCHEDULED: {
    bg: 'var(--color-status-info-bg)',
    fg: 'var(--color-status-info-fg)',
    label: 'Pickup Scheduled',
  },
  IN_TRANSIT: { bg: 'var(--color-status-warning-bg)', fg: 'var(--color-status-warning-fg)', label: 'In Transit' },
  PROCESSING: { bg: 'var(--color-status-warning-bg)', fg: 'var(--color-status-warning-fg)', label: 'Processing' },
  COMPLETED: { bg: 'var(--color-status-success-bg)', fg: 'var(--color-status-success-fg)', label: 'Completed' },
  CANCELLED: { bg: 'var(--color-status-danger-bg)', fg: 'var(--color-status-danger-fg)', label: 'Cancelled' },
};

export function StatusBadge({ status }: { status: WorkOrderStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.2rem 0.6rem',
        borderRadius: 999,
        background: style.bg,
        color: style.fg,
        fontSize: '0.8rem',
        fontWeight: 600,
      }}
    >
      {style.label}
    </span>
  );
}
