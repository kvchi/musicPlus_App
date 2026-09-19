export type RepeatMode = "off" | "all" | "one";
export interface Traversal {
  order: readonly number[];
  // The forward frontier stays put while Previous/Next retrace visited entries.
  position: number;
  history: readonly number[];
  historyPosition: number;
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
  if (!length) return { order: [], position: -1, history: [], historyPosition: -1 };
  const order = shuffle ? [current, ...shuffled(indices.filter(index => index !== current), random)] : indices;
  return { order, position: shuffle ? 0 : current, history: [current], historyPosition: 0 };
}
export function toggleTraversal(state: Traversal, current: number, shuffle: boolean, random: Random = Math.random): Traversal {
  // A mode toggle starts a new cycle, without selecting or replaying its anchor.
  return { ...createTraversal(state.order.length, current, shuffle, random),
    history: state.history.slice(0, state.historyPosition + 1), historyPosition: state.historyPosition };
}
function visit(state: Traversal, index: number, order = state.order, position = state.position) {
  const history = [...state.history.slice(0, state.historyPosition + 1), index];
  return { index, traversal: { order, position, history, historyPosition: history.length - 1 } };
}
export function nextTraversal(state: Traversal, automatic: boolean, repeat: RepeatMode, shuffle: boolean, random: Random = Math.random) {
  const length = state.order.length;
  if (!length) return null;
  if (shuffle && state.historyPosition + 1 < state.history.length) {
    const historyPosition = state.historyPosition + 1;
    return { index: state.history[historyPosition], traversal: { ...state, historyPosition } };
  }
  if (state.position + 1 < length) return visit(state, state.order[state.position + 1], state.order, state.position + 1);
  if (automatic && repeat === "off") return null;
  const order = Array.from({ length }, (_, index) => index);
  if (shuffle) {
    shuffled(order, random);
    // A fresh cycle includes every track, but does not repeat the boundary track.
    if (length > 1 && order[0] === state.order[state.position]) [order[0], order[1]] = [order[1], order[0]];
  }
  return visit(state, order[0], order, 0);
}
export function previousTraversal(state: Traversal, shuffle: boolean) {
  if (!state.order.length) return null;
  if (shuffle) {
    if (state.historyPosition <= 0) return null;
    const historyPosition = state.historyPosition - 1;
    return { index: state.history[historyPosition], traversal: { ...state, historyPosition } };
  }
  const index = (state.order[state.position] + state.order.length - 1) % state.order.length;
  return visit(state, index, state.order, index);
}
