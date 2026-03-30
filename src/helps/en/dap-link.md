# DAPLink (CMSIS-DAP)

Programs over SWD using a DAPLink-compatible probe (WebUSB / HID depending on build).

## Requirements

- DAPLink firmware with browser-accessible transport where supported.
- SWD connected (`SWDIO`, `SWCLK`, `GND`).

## Steps

1. Select `dap-link`.
2. Choose firmware.
3. Authorize / select the probe.
4. Wait for completion.

## Troubleshooting

Re-seat USB, verify WebUSB support on the probe, check SWD and optional `NRST`.
