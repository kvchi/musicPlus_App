export type RepeatMode = "off" | "all" | "one";
export interface Traversal {
  order: readonly number[];
  // The forward frontier stays put while Previous/Next retrace visited entries.
  position: number;
  history: readonly number[];
  historyPosition: number;
  // Explicit Play Next entries precede the remaining traversal. Entries played
  // early are skipped at their old position, then restored on a new cycle.
  priority: readonly number[];
  consumedEarly: readonly number[];
  // Removed queue slots stay excluded, including on repeat cycles.
  excluded: readonly number[];
}
type Random = () => number;
function shuffled(items: number[], random: Random) {
  for (let index = items.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [items[index], items[other]] = [items[other], items[index]];
  }
  return items;
}
export function createTraversal(length: number, current: number, shuffle: boolean, random: Random = Math.random): Traversal {
  const indices = Array.from({ length }, (_, index) => index);
  if (!length) return { order: [], position: -1, history: [], historyPosition: -1, priority: [], consumedEarly: [], excluded: [] };
  const order = shuffle ? [current, ...shuffled(indices.filter(index => index !== current), random)] : indices;
  return { order, position: shuffle ? 0 : current, history: [current], historyPosition: 0, priority: [], consumedEarly: [], excluded: [] };
}
export function toggleTraversal(state: Traversal, current: number, shuffle: boolean, random: Random = Math.random): Traversal {
  // A mode toggle starts a new cycle, without selecting or replaying its anchor.
  return { ...createTraversal(state.order.length, current, shuffle, random),
    history: state.history.slice(0, state.historyPosition + 1), historyPosition: state.historyPosition,
    priority: [...state.history.slice(state.historyPosition + 1), ...state.priority], excluded: state.excluded };
}
function visit(state: Traversal, index: number, order = state.order, position = state.position) {
  const history = [...state.history.slice(0, state.historyPosition + 1), index];
  return { index, traversal: { ...state, order, position, history, historyPosition: history.length - 1 } };
}
export function upcomingIndices(state: Traversal): number[] {
  const pending = [...state.history.slice(state.historyPosition + 1), ...state.priority]
    .filter(index => !state.excluded.includes(index));
  const planned = new Set(pending);
  return [...pending, ...state.order.slice(state.position + 1).filter(index =>
    !planned.has(index) && !state.consumedEarly.includes(index) && !state.excluded.includes(index))];
}
export type UpcomingEdit = "remove" | "up" | "down";
export function editUpcoming(state: Traversal, index: number, action: UpcomingEdit): Traversal | null {
  const upcoming = upcomingIndices(state);
  const place = upcoming.indexOf(index);
  if (place < 0 || (action === "up" && place === 0) ||
    (action === "down" && place === upcoming.length - 1)) return null;
  if (action === "remove") upcoming.splice(place, 1);
  else {
    const other = action === "up" ? place - 1 : place + 1;
    [upcoming[place], upcoming[other]] = [upcoming[other], upcoming[place]];
  }
  return { ...state, priority: upcoming,
    history: state.history.slice(0, state.historyPosition + 1),
    consumedEarly: [...new Set([...state.consumedEarly, ...state.order.slice(state.position + 1)])],
    excluded: action === "remove" ? [...state.excluded, index] : state.excluded };
}
export function editTraversal(state: Traversal, index: number, action: "next" | "end", isNew: boolean): Traversal {
  const forward = state.history.slice(state.historyPosition + 1);
  const priority = [...forward, ...state.priority];
  const order = isNew ? [...state.order, index] : state.order;
  if (action === "next") {
    const existing = priority.indexOf(index);
    if (existing >= 0) priority.splice(existing, 1);
    priority.unshift(index);
  } else if (state.excluded.includes(index)) {
    priority.push(index);
  }
  return { ...state, order, priority, excluded: state.excluded.filter(item => item !== index),
    history: state.history.slice(0, state.historyPosition + 1) };
}
export function nextTraversal(state: Traversal, automatic: boolean, repeat: RepeatMode, shuffle: boolean, random: Random = Math.random) {
  const length = state.order.length;
  if (!length) return null;
  if (state.historyPosition + 1 < state.history.length) {
    const historyPosition = state.historyPosition + 1;
    return { index: state.history[historyPosition], traversal: { ...state, historyPosition } };
  }
  if (state.priority.length) {
    const index = state.priority[0];
    const early = state.order.slice(state.position + 1).includes(index);
    const step = visit(state, index);
    return { index, traversal: { ...step.traversal, priority: state.priority.slice(1),
      consumedEarly: early && !state.consumedEarly.includes(index)
        ? [...state.consumedEarly, index] : state.consumedEarly } };
  }
  let nextPosition = state.position + 1;
  while (nextPosition < length && (state.consumedEarly.includes(state.order[nextPosition]) || state.excluded.includes(state.order[nextPosition]))) nextPosition++;
  if (nextPosition < length) return visit(state, state.order[nextPosition], state.order, nextPosition);
  if (automatic && repeat === "off") return null;
  const active = Array.from({ length }, (_, index) => index).filter(index => !state.excluded.includes(index));
  if (!active.length) return null;
  if (shuffle) {
    shuffled(active, random);
    // A fresh cycle includes every track, but does not repeat the boundary track.
    if (active.length > 1 && active[0] === state.history[state.historyPosition]) [active[0], active[1]] = [active[1], active[0]];
  }
  const order = [...active, ...state.excluded];
  const step = visit(state, order[0], order, 0);
  return { index: step.index, traversal: { ...step.traversal, consumedEarly: [] } };
}
export function previousTraversal(state: Traversal, shuffle: boolean) {
  if (!state.order.length) return null;
  if (state.historyPosition > 0) {
    const historyPosition = state.historyPosition - 1;
    return { index: state.history[historyPosition], traversal: { ...state, historyPosition } };
  }
  if (shuffle) {
    return null;
  }
  const currentPosition = state.order.indexOf(state.history[state.historyPosition]);
  let position = (currentPosition + state.order.length - 1) % state.order.length;
  while (state.excluded.includes(state.order[position]) && position !== currentPosition) {
    position = (position + state.order.length - 1) % state.order.length;
  }
  return visit(state, state.order[position], state.order, position);
}
