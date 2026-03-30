import type { SerialTransport } from "@/transports/types";

export class WebSerialTransport implements SerialTransport {
  readonly name = "web-serial";
  private port: SerialPort | null = null;
  // Do not hold reader/writer locks here.
  // Protocol implementations (e.g. UARTISP) may need to lock the stream too.
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;

  constructor(private readonly baudRate = 115200) {}

  async selectDevice(): Promise<void> {
    if (!("serial" in navigator)) throw new Error("WebSerial is not supported");
    const serialApi = navigator.serial as Serial;
    this.port = await serialApi.requestPort();
  }

  isDeviceReady(): boolean {
    return Boolean(this.port);
  }

  getDeviceLabel(): string | null {
    if (!this.port) return null;
    const info = this.port.getInfo?.();
    if (!info) return "Serial device";
    const vendor = typeof info.usbVendorId === "number" ? info.usbVendorId.toString(16) : "unknown";
    const product = typeof info.usbProductId === "number" ? info.usbProductId.toString(16) : "unknown";
    return `Serial ${vendor}:${product}`;
  }

  async open(): Promise<void> {
    if (!this.port) {
      await this.selectDevice();
    }
    if (!this.port) throw new Error("Serial port is not selected");
    if (this.port.readable && this.port.writable) return;
    await this.port.open({ baudRate: this.baudRate });
    // Intentionally do not lock readable/writable here.
  }

  async releaseSession(): Promise<void> {
    await this.reader?.cancel().catch(() => undefined);
    this.reader?.releaseLock();
    this.writer?.releaseLock();
    this.reader = null;
    this.writer = null;
  }

  async close(): Promise<void> {
    await this.releaseSession();
    await this.port?.close().catch(() => undefined);
    this.port = null;
  }

  async write(data: Uint8Array): Promise<void> {
    if (!this.port) throw new Error("Serial port is not opened");
    if (!this.port.writable) throw new Error("Serial writable stream unavailable");
    const writer = this.port.writable.getWriter();
    try {
      await writer.write(data);
    } finally {
      writer.releaseLock();
    }
  }

  async read(size: number, timeoutMs = 1000): Promise<Uint8Array> {
    if (!this.port) throw new Error("Serial port is not opened");
    if (!this.port.readable) throw new Error("Serial readable stream unavailable");
    const reader = this.port.readable.getReader();
    const deadline = Date.now() + timeoutMs;
    const chunks: number[] = [];
    try {
      while (chunks.length < size) {
        if (Date.now() > deadline) throw new Error("Serial read timeout");
        const result = await reader.read();
        if (result.done) throw new Error("Serial closed");
        if (result.value) chunks.push(...result.value);
      }
      return Uint8Array.from(chunks.slice(0, size));
    } finally {
      reader.releaseLock();
    }
  }

  async cancel(): Promise<void> {
    await this.reader?.cancel().catch(() => undefined);
  }

  getPort(): SerialPort {
    if (!this.port) throw new Error("Serial port is not opened");
    return this.port;
  }
}
