/**
 * Request Queue - Serializa requisições para evitar conflitos de concorrência
 * Evita erro 400 quando múltiplas requisições são feitas simultaneamente
 */

interface QueuedRequest {
  fn: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}

class RequestQueue {
  private queue: QueuedRequest[] = [];
  private processing = false;
  private maxRetries = 3;
  private retryDelay = 1000; // ms

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const request = this.queue.shift();
      if (!request) break;

      try {
        let lastError: Error | null = null;

        // Retry logic com backoff exponencial
        for (let attempt = 0; attempt < this.maxRetries; attempt++) {
          try {
            const result = await request.fn();
            request.resolve(result);
            lastError = null;
            break;
          } catch (error) {
            lastError = error as Error;
            if (attempt < this.maxRetries - 1) {
              const delay = this.retryDelay * Math.pow(2, attempt);
              console.warn(
                `Retry attempt ${attempt + 1}/${this.maxRetries} after ${delay}ms:`,
                error
              );
              await new Promise((r) => setTimeout(r, delay));
            }
          }
        }

        if (lastError) {
          request.reject(lastError);
        }
      } catch (error) {
        request.reject(error);
      }

      // Pequeno delay entre requisições para evitar sobrecarga
      await new Promise((r) => setTimeout(r, 100));
    }

    this.processing = false;
  }
}

export const requestQueue = new RequestQueue();
