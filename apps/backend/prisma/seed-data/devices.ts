// The 3 simulated devices from the PPT's hardware list (plan Context
// section): 2 IoT weight scales (inlet/outlet) + 1 CV camera. All three
// share one fixed demo API key (SIMULATOR_DEVICE_API_KEY) for this PoC —
// a real deployment would issue a distinct key per device via
// POST /ingestion/devices instead of reusing one across all simulated
// hardware.
export const DEVICES = [
  { deviceCode: 'WS-INLET-01', deviceType: 'WEIGHT_SCALE' as const, purpose: 'INLET' as const },
  { deviceCode: 'WS-OUTLET-01', deviceType: 'WEIGHT_SCALE' as const, purpose: 'OUTLET' as const },
  { deviceCode: 'CV-CAM-01', deviceType: 'CV_CAMERA' as const, purpose: 'PROCESS_MONITOR' as const },
];

export const SIMULATOR_DEVICE_API_KEY = process.env.SIMULATOR_DEVICE_API_KEY ?? 'demo-simulator-key-change-me';
