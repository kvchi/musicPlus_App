import { describe, expect, it } from "vitest";
import { createTraversal, editTraversal, editUpcoming, nextTraversal, previousTraversal, toggleTraversal, upcomingIndices } from "@/lib/queue-traversal";

const random = () => 0;
describe("queue traversal", () => {
  it("anchors a shuffled cycle on the current track without duplicates", () => {
    const state = createTraversal(5, 2, true, random);
    expect(state.order[0]).toBe(2);
    expect([...state.order].sort()).toEqual([0, 1, 2, 3, 4]);
    let traversal = state;
    const visited = [2];
    for (let count = 1; count < 5; count++) {
      const step = nextTraversal(traversal, true, "off", true, random)!;
      traversal = step.traversal; visited.push(step.index);
    }
    expect(new Set(visited).size).toBe(5);
    expect(nextTraversal(traversal, true, "off", true, random)).toBeNull();
    expect(state.history).toEqual([2]);
  });
  it.each([false, true])("wraps manually and repeat-all starts a fresh cycle (shuffle: %s)", shuffle => {
    let traversal = createTraversal(3, shuffle ? 0 : 2, shuffle, random);
    if (shuffle) for (let i = 0; i < 2; i++) traversal = nextTraversal(traversal, true, "off", true, random)!.traversal;
    const last = traversal.order[traversal.position];
    expect(nextTraversal(traversal, true, "off", shuffle, random)).toBeNull();
    const wrapped = nextTraversal(traversal, true, "all", shuffle, random)!;
    expect(wrapped.index).not.toBe(last);
    expect(new Set(wrapped.traversal.order).size).toBe(3);
    expect(nextTraversal(traversal, false, "one", shuffle, random)).toEqual(wrapped);
  });
  it("walks backward and forward through history before consuming another shuffle slot", () => {
    const initial = createTraversal(4, 0, true, random);
    const first = nextTraversal(initial, false, "off", true, random)!;
    const second = nextTraversal(first.traversal, false, "off", true, random)!;
    const back = previousTraversal(second.traversal, true)!;
    expect(back.index).toBe(first.index);
    const forward = nextTraversal(back.traversal, false, "off", true, random)!;
    expect(forward.index).toBe(second.index);
    expect(forward.traversal.order).toEqual(second.traversal.order);
    expect(nextTraversal(forward.traversal, false, "off", true, random)!.index).toBe(initial.order[3]);
    expect(previousTraversal(initial, true)).toBeNull();
  });
  it("starts a new anchored cycle on toggle, retaining past and discarding forward history", () => {
    const start = createTraversal(4, 0, true, random);
    const first = nextTraversal(start, false, "off", true, random)!;
    const second = nextTraversal(first.traversal, false, "off", true, random)!;
    const back = previousTraversal(second.traversal, true)!;
    const toggled = toggleTraversal(back.traversal, back.index, true, random);
    expect(toggled.order[0]).toBe(back.index);
    expect(toggled.history).toEqual([0, first.index]);
    const off = toggleTraversal(toggled, back.index, false, random);
    expect(off.order).toEqual([0, 1, 2, 3]);
    expect(off.position).toBe(back.index);
  });
  it.each([false, true])("handles empty and single-track traversals (shuffle: %s)", shuffle => {
    const empty = createTraversal(0, -1, shuffle, random);
    expect(nextTraversal(empty, false, "all", shuffle, random)).toBeNull();
    expect(previousTraversal(empty, shuffle)).toBeNull();
    const one = createTraversal(1, 0, shuffle, random);
    expect(nextTraversal(one, true, "off", shuffle, random)).toBeNull();
    expect(nextTraversal(one, true, "all", shuffle, random)!.index).toBe(0);
    expect(nextTraversal(one, false, "one", shuffle, random)!.index).toBe(0);
  });
});

describe("edited Up Next traversal", () => {
  it("plays a new Play Next entry before the original order and an added entry last", () => {
    let state = createTraversal(3, 0, false);
    state = editTraversal(state, 3, "next", true);
    state = editTraversal(state, 4, "end", true);
    expect(upcomingIndices(state)).toEqual([3, 1, 2, 4]);
    for (const expected of [3, 1, 2, 4]) {
      const step = nextTraversal(state, true, "off", false)!;
      expect(step.index).toBe(expected);
      state = step.traversal;
    }
    expect(nextTraversal(state, true, "off", false)).toBeNull();
    expect(upcomingIndices(state)).toEqual([]);
  });
  it("promotes one existing upcoming entry without playing it twice", () => {
    let state = editTraversal(createTraversal(3, 0, false), 2, "next", false);
    expect(upcomingIndices(state)).toEqual([2, 1]);
    const first = nextTraversal(state, false, "off", false)!;
    expect(first.index).toBe(2);
    state = first.traversal;
    expect(upcomingIndices(state)).toEqual([1]);
    expect(nextTraversal(state, false, "off", false)!.index).toBe(1);
  });
  it("keeps forward playback history when Play Next is used after Previous", () => {
    let state = createTraversal(3, 0, false);
    state = nextTraversal(state, false, "off", false)!.traversal;
    state = nextTraversal(state, false, "off", false)!.traversal;
    state = previousTraversal(state, false)!.traversal;
    expect(upcomingIndices(state)).toEqual([2]);
    state = editTraversal(state, 3, "next", true);
    expect(upcomingIndices(state)).toEqual([3, 2]);
    state = nextTraversal(state, false, "off", false)!.traversal;
    expect(previousTraversal(state, false)!.index).toBe(1);
    expect(nextTraversal(state, false, "off", false)!.index).toBe(2);
  });
  it("keeps explicit Play Next ahead of a reshuffled remainder and repeats the full queue next cycle", () => {
    let state = createTraversal(3, 0, true, random);
    state = editTraversal(state, 3, "end", true);
    state = editTraversal(state, 4, "next", true);
    state = toggleTraversal(state, 0, true, random);
    expect(upcomingIndices(state)[0]).toBe(4);
    const visited = [0];
    for (let count = 0; count < 4; count++) {
      const step = nextTraversal(state, true, "off", true, random)!;
      visited.push(step.index); state = step.traversal;
    }
    expect(new Set(visited).size).toBe(5);
    expect(nextTraversal(state, true, "off", true, random)).toBeNull();
    const wrap = nextTraversal(state, true, "all", true, random)!;
    expect(wrap.index).not.toBe(visited.at(-1));
    expect(new Set(wrap.traversal.order).size).toBe(5);
  });
  it("handles empty and one-track edited queues", () => {
    const empty = createTraversal(0, -1, false);
    expect(upcomingIndices(empty)).toEqual([]);
    const one = createTraversal(1, 0, false);
    expect(upcomingIndices(one)).toEqual([]);
    const two = editTraversal(one, 1, "next", true);
    expect(upcomingIndices(two)).toEqual([1]);
    expect(nextTraversal(two, false, "one", false)!.index).toBe(1);
  });
});

describe("Phase 4B Up Next edits", () => {
  it("moves entries in displayed and actual Next order, then removes exactly one slot", () => {
    let state = createTraversal(4, 0, false);
    state = editUpcoming(state, 3, "up")!;
    expect(upcomingIndices(state)).toEqual([1, 3, 2]);
    state = editUpcoming(state, 1, "down")!;
    expect(upcomingIndices(state)).toEqual([3, 1, 2]);
    state = editUpcoming(state, 1, "remove")!;
    expect(upcomingIndices(state)).toEqual([3, 2]);
    expect(editUpcoming(state, 0, "remove")).toBeNull();
    for (const index of [3, 2]) {
      const step = nextTraversal(state, false, "off", false)!;
      expect(step.index).toBe(index); state = step.traversal;
    }
    expect(nextTraversal(state, true, "off", false)).toBeNull();
  });
  it("keeps removed slots out of repeat-all and preserves edits across shuffle toggle", () => {
    let state = createTraversal(4, 0, true, random);
    const removed = upcomingIndices(state)[1];
    state = editUpcoming(state, removed, "remove")!;
    state = editUpcoming(state, upcomingIndices(state)[1], "up")!;
    const plan = upcomingIndices(state);
    state = toggleTraversal(state, 0, false, random);
    expect(upcomingIndices(state)).toEqual(plan);
    for (const index of plan) {
      const step = nextTraversal(state, true, "all", false, random)!;
      expect(step.index).toBe(index); state = step.traversal;
    }
    const wrap = nextTraversal(state, true, "all", false, random)!;
    expect(wrap.index).toBe(0);
    expect(wrap.traversal.order).toHaveLength(4);
    expect(upcomingIndices(wrap.traversal)).not.toContain(removed);
  });
  it("retains played history and edits forward history without changing the current slot", () => {
    let state = createTraversal(4, 0, false);
    state = nextTraversal(state, false, "off", false)!.traversal;
    state = nextTraversal(state, false, "off", false)!.traversal;
    state = previousTraversal(state, false)!.traversal;
    expect(state.history[state.historyPosition]).toBe(1);
    state = editUpcoming(state, 2, "remove")!;
    expect(state.history).toEqual([0, 1]);
    expect(upcomingIndices(state)).toEqual([3]);
    expect(previousTraversal(state, false)!.index).toBe(0);
    expect(nextTraversal(state, false, "off", false)!.index).toBe(3);
  });
  it("handles no upcoming item, a single item, and an edit at the end", () => {
    expect(editUpcoming(createTraversal(0, -1, false), 0, "remove")).toBeNull();
    expect(editUpcoming(createTraversal(1, 0, false), 0, "remove")).toBeNull();
    let state = createTraversal(2, 0, false);
    expect(editUpcoming(state, 1, "up")).toBeNull();
    expect(editUpcoming(state, 1, "down")).toBeNull();
    state = editUpcoming(state, 1, "remove")!;
    expect(upcomingIndices(state)).toEqual([]);
    expect(nextTraversal(state, true, "off", false)).toBeNull();
    expect(nextTraversal(state, false, "off", false)!.index).toBe(0);
    expect(previousTraversal(state, false)!.index).toBe(0);
    state = editTraversal(state, 1, "end", false);
    expect(upcomingIndices(state)).toEqual([1]);
  });
});
