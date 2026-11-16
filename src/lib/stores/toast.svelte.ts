export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

class ToastManager {
  items = $state<ToastItem[]>([]);

  show(message: string, type: ToastType = 'info', durationMs = 3500) {
    const id = Math.random().toString(36).substring(2, 9);
    const item: ToastItem = { id, type, message };

    this.items.push(item);

    if (durationMs > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, durationMs);
    }
  }

  success(message: string, durationMs = 3500) {
    this.show(message, 'success', durationMs);
  }

  error(message: string, durationMs = 4500) {
    this.show(message, 'error', durationMs);
  }

  info(message: string, durationMs = 3500) {
    this.show(message, 'info', durationMs);
  }

  dismiss(id: string) {
    this.items = this.items.filter((item) => item.id !== id);
  }
}

export const toast = new ToastManager();
