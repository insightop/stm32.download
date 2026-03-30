# USB DFU

Uses the USB device firmware upgrade class via WebUSB.

## Requirements

- Board in DFU mode (`BOOT0` / reset sequence per board docs).
- Chromium + WebUSB.

## Steps

1. Select `usb-dfu`.
2. Choose firmware.
3. Select the DFU device when prompted.
4. Wait for completion.

## Windows

You may need a WinUSB/libusb driver (e.g. Zadig) for the DFU interface.
