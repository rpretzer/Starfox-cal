/**
 * Offline mutation queue — persists operations while offline and replays them when connectivity is restored.
 */

export type MutationOperation = 'saveMeeting' | 'deleteMeeting' | 'saveCategory' | 'deleteCategory';

export interface QueuedMutation {
  id: string;
  operation: MutationOperation;
  payload: unknown;
  timestamp: number;
}

const STORAGE_KEY = 'starfox_offline_queue';

function loadQueue(): QueuedMutation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as QueuedMutation[]) : [];
  } catch {
    return [];
  }
}

function persistQueue(queue: QueuedMutation[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // localStorage may be full or unavailable
  }
}

let queue: QueuedMutation[] = loadQueue();

export function enqueue(operation: MutationOperation, payload: unknown): string {
  const mutation: QueuedMutation = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    operation,
    payload,
    timestamp: Date.now(),
  };
  queue = [...queue, mutation];
  persistQueue(queue);
  return mutation.id;
}

export function dequeue(id: string): void {
  queue = queue.filter(m => m.id !== id);
  persistQueue(queue);
}

export function getPendingMutations(): QueuedMutation[] {
  return [...queue];
}

export function clearQueue(): void {
  queue = [];
  persistQueue(queue);
}

/**
 * Flush the offline queue by running each queued mutation through the provided executor.
 * Successfully processed mutations are removed from the queue; failures are left in place.
 */
export async function flushQueue(
  executor: (mutation: QueuedMutation) => Promise<void>
): Promise<void> {
  const pending = getPendingMutations();
  for (const mutation of pending) {
    try {
      await executor(mutation);
      dequeue(mutation.id);
    } catch {
      // Leave failed mutations in queue for the next flush attempt
    }
  }
}
