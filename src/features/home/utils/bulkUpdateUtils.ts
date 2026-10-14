// Only reconcile the operation's targets; unrelated edits stay in local state.
// A target missing from the server response has been removed remotely.
export const replaceSelectedRecords = <T extends { id: string }>(
  current: T[],
  incoming: T[],
  ids: Iterable<string>
): T[] => {
  const selected = new Set(ids);
  const replacements = incoming.filter((item) => selected.has(item.id));
  return [...current.filter((item) => !selected.has(item.id)), ...replacements];
};
