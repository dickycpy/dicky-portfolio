// -----------------------------------------------------------------------------
// Unsaved-changes guard
//
// A tiny app-wide store that tracks which admin editors currently have unsaved
// edits. Editors call `markDirty(id, true/false)` as their dirty state changes
// (and `markDirty(id, false)` on unmount / after a successful save). The admin
// shell subscribes so it can:
//   1. warn before switching tabs (in-app navigation), and
//   2. warn before closing / reloading the tab (browser `beforeunload`).
//
// Using a shared store (rather than lifting state) keeps each editor
// self-contained and correctly handles pages that render more than one editor
// at once (e.g. the Home Page tab has Home + Logo-wall editors).
// -----------------------------------------------------------------------------

const dirtyIds = new Set<string>();
const listeners = new Set<(count: number) => void>();

function emit() {
  listeners.forEach((l) => l(dirtyIds.size));
}

/** Register/clear the dirty state of a single editor instance. */
export function markDirty(id: string, dirty: boolean): void {
  const had = dirtyIds.has(id);
  if (dirty && !had) dirtyIds.add(id);
  else if (!dirty && had) dirtyIds.delete(id);
  else return; // no change
  emit();
}

/** True if any editor has unsaved changes right now. */
export function hasUnsaved(): boolean {
  return dirtyIds.size > 0;
}

/** Forget all unsaved state (e.g. user chose to discard and navigate away). */
export function clearAllUnsaved(): void {
  if (dirtyIds.size === 0) return;
  dirtyIds.clear();
  emit();
}

/** Subscribe to changes in the number of dirty editors. Returns an unsubscribe. */
export function subscribeUnsaved(l: (count: number) => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}
