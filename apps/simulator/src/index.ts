import { createServer } from 'node:http';
import { MockCvCameraSource, MockWeightScaleSource, type IDeviceSource } from './device-source';

// The simulator is otherwise a pure outbound loop (posts readings, listens
// for nothing) — Render's free plan only runs `type: web` services, which
// require *something* answering on $PORT to be considered healthy. This
// exists for that health check alone; nothing calls into it.
if (process.env.PORT) {
  createServer((_req, res) => res.writeHead(200).end('ok')).listen(Number(process.env.PORT));
}

const BACKEND_URL = process.env.SIMULATOR_BACKEND_URL ?? 'http://localhost:3000';
const INTERVAL_MS = Number(process.env.SIMULATOR_INTERVAL_MS ?? 15000);
const ENABLED = (process.env.SIMULATOR_ENABLED ?? 'true') === 'true';
const DEVICE_API_KEY = process.env.SIMULATOR_DEVICE_API_KEY;

// Device codes match prisma/seed-data/devices.ts exactly — a real device
// would have its own code baked into its own config, not read from this
// repo, but for the simulator standing in for 3 known demo devices this is
// the simplest way to stay in sync with what the seed actually created.
const SOURCES: IDeviceSource[] = [
  new MockWeightScaleSource('WS-INLET-01', 'INLET_WEIGHT'),
  new MockWeightScaleSource('WS-OUTLET-01', 'OUTLET_WEIGHT'),
  new MockCvCameraSource('CV-CAM-01'),
];

async function postReading(source: IDeviceSource) {
  const reading = source.generateReading();
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/ingestion/readings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Key': DEVICE_API_KEY ?? '',
      },
      body: JSON.stringify(reading),
    });
    if (!response.ok) {
      const body = await response.text();
      console.error(`[simulator] ${source.deviceCode} reading rejected (${response.status}): ${body}`);
      return;
    }
    console.log(`[simulator] ${source.deviceCode} -> ${reading.readingType} ${reading.value}${reading.unit} accepted`);
  } catch (err) {
    console.error(`[simulator] ${source.deviceCode} could not reach backend at ${BACKEND_URL}:`, (err as Error).message);
  }
}

function tick() {
  for (const source of SOURCES) {
    void postReading(source);
  }
}

if (!ENABLED) {
  console.log('[simulator] SIMULATOR_ENABLED=false — idling, no readings will be posted');
} else if (!DEVICE_API_KEY) {
  console.error('[simulator] SIMULATOR_DEVICE_API_KEY is not set — cannot authenticate, idling');
} else {
  console.log(
    `[simulator] posting readings for ${SOURCES.length} device(s) to ${BACKEND_URL} every ${INTERVAL_MS}ms`,
  );
  tick();
  setInterval(tick, INTERVAL_MS);
}
