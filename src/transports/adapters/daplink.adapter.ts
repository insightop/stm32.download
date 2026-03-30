export interface DaplinkAdapter {
  connect(): Promise<void>;
  flash(image: Uint8Array): Promise<void>;
  disconnect(): Promise<void>;
}

export function createDaplinkAdapter(): DaplinkAdapter {
  return {
    async connect() {
      // Implementation should bind to webdap transport at integration time.
    },
    async flash(_image) {
      // Implementation should call DAPLink#flash.
    },
    async disconnect() {
      // Implementation should release CMSIS-DAP transport.
    },
  };
}
