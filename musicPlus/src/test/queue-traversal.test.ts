import { describe, expect, it } from "vitest";
import { createTraversal, nextTraversal, previousTraversal, toggleTraversal } from "@/lib/queue-traversal";

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
