
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  isDestructive?: boolean;
}

class FeedbackStore {
  private listeners: (() => void)[] = [];
  private toasts: Toast[] = [];
  private activeConfirm: ConfirmOptions | null = null;

  public subscribe(cb: () => void) {
    this.listeners.push(cb);
    return () => { this.listeners = this.listeners.filter(l => l !== cb); };
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  // TOAST SYSTEM
  public toast(type: ToastType, title: string, message?: string) {
    const id = Math.random().toString(36).substring(2, 9);
    this.toasts = [...this.toasts, { id, type, title, message }];
    this.notify();

    setTimeout(() => {
      this.removeToast(id);
    }, 4000);
  }

  public removeToast(id: string) {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.notify();
  }

  public getToasts() { return this.toasts; }

  // CONFIRM SYSTEM
  public confirm(options: ConfirmOptions) {
    this.activeConfirm = options;
    this.notify();
  }

  public resolveConfirm(confirmed: boolean) {
    if (!this.activeConfirm) return;
    if (confirmed) {
      this.activeConfirm.onConfirm();
    } else if (this.activeConfirm.onCancel) {
      this.activeConfirm.onCancel();
    }
    this.activeConfirm = null;
    this.notify();
  }

  public getConfirm() { return this.activeConfirm; }
}

export const vantaFeedback = new FeedbackStore();
