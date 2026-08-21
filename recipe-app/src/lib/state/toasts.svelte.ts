export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
	id: number;
	kind: ToastKind;
	message: string;
	/** Optional inline action, e.g. "Undo". */
	action?: { label: string; run: () => void };
}

/**
 * Transient feedback messages.
 *
 * Deliberately not persisted: a toast that survives a reload is a bug, not a
 * feature. Each toast owns its dismissal timer so that dismissing one early
 * never cancels another's.
 */
class ToastStore {
	#items = $state<Toast[]>([]);
	#nextId = 0;
	#timers = new Map<number, ReturnType<typeof setTimeout>>();

	get items(): Toast[] {
		return this.#items;
	}

	push(message: string, kind: ToastKind = 'info', action?: Toast['action'], duration = 4000): number {
		const id = this.#nextId++;
		this.#items = [...this.#items, { id, kind, message, action }];

		this.#timers.set(
			id,
			setTimeout(() => this.dismiss(id), duration)
		);

		return id;
	}

	success(message: string, action?: Toast['action']): number {
		return this.push(message, 'success', action);
	}

	error(message: string): number {
		// Errors get longer on screen, since they usually need reading.
		return this.push(message, 'error', undefined, 6000);
	}

	info(message: string, action?: Toast['action']): number {
		return this.push(message, 'info', action);
	}

	dismiss(id: number): void {
		const timer = this.#timers.get(id);
		if (timer) {
			clearTimeout(timer);
			this.#timers.delete(id);
		}
		this.#items = this.#items.filter((toast) => toast.id !== id);
	}
}

export const toasts = new ToastStore();
