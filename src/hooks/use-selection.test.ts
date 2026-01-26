import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSelection } from "./use-selection";

interface TestItem {
  id: string;
  name: string;
}

const testItems: TestItem[] = [
  { id: "1", name: "Item 1" },
  { id: "2", name: "Item 2" },
  { id: "3", name: "Item 3" },
];

describe("useSelection", () => {
  it("should initialize with empty selection", () => {
    const { result } = renderHook(() => useSelection({ items: testItems }));

    expect(result.current.selectedIds).toEqual([]);
    expect(result.current.selectedCount).toBe(0);
    expect(result.current.isAllSelected).toBe(false);
  });

  it("should toggle an item on", () => {
    const { result } = renderHook(() => useSelection({ items: testItems }));

    act(() => {
      result.current.toggle("1");
    });

    expect(result.current.selectedIds).toContain("1");
    expect(result.current.selectedCount).toBe(1);
  });

  it("should toggle an item off", () => {
    const { result } = renderHook(() => useSelection({ items: testItems }));

    act(() => {
      result.current.toggle("1");
    });

    expect(result.current.selectedIds).toContain("1");

    act(() => {
      result.current.toggle("1");
    });

    expect(result.current.selectedIds).not.toContain("1");
    expect(result.current.selectedCount).toBe(0);
  });

  it("should check if item is selected", () => {
    const { result } = renderHook(() => useSelection({ items: testItems }));

    expect(result.current.isSelected("1")).toBe(false);

    act(() => {
      result.current.toggle("1");
    });

    expect(result.current.isSelected("1")).toBe(true);
    expect(result.current.isSelected("2")).toBe(false);
  });

  it("should select a specific item", () => {
    const { result } = renderHook(() => useSelection({ items: testItems }));

    act(() => {
      result.current.select("2");
    });

    expect(result.current.isSelected("2")).toBe(true);
    expect(result.current.selectedCount).toBe(1);

    // Selecting again should not add duplicate
    act(() => {
      result.current.select("2");
    });

    expect(result.current.selectedCount).toBe(1);
  });

  it("should deselect a specific item", () => {
    const { result } = renderHook(() => useSelection({ items: testItems }));

    act(() => {
      result.current.select("1");
      result.current.select("2");
    });

    expect(result.current.selectedCount).toBe(2);

    act(() => {
      result.current.deselect("1");
    });

    expect(result.current.isSelected("1")).toBe(false);
    expect(result.current.isSelected("2")).toBe(true);
    expect(result.current.selectedCount).toBe(1);
  });

  it("should select all items", () => {
    const { result } = renderHook(() => useSelection({ items: testItems }));

    act(() => {
      result.current.selectAll();
    });

    expect(result.current.selectedCount).toBe(3);
    expect(result.current.isSelected("1")).toBe(true);
    expect(result.current.isSelected("2")).toBe(true);
    expect(result.current.isSelected("3")).toBe(true);
    expect(result.current.isAllSelected).toBe(true);
  });

  it("should deselect all items", () => {
    const { result } = renderHook(() => useSelection({ items: testItems }));

    act(() => {
      result.current.selectAll();
    });

    expect(result.current.selectedCount).toBe(3);

    act(() => {
      result.current.deselectAll();
    });

    expect(result.current.selectedCount).toBe(0);
    expect(result.current.isAllSelected).toBe(false);
  });

  it("should toggle all items", () => {
    const { result } = renderHook(() => useSelection({ items: testItems }));

    // Toggle all on
    act(() => {
      result.current.toggleAll();
    });

    expect(result.current.isAllSelected).toBe(true);
    expect(result.current.selectedCount).toBe(3);

    // Toggle all off
    act(() => {
      result.current.toggleAll();
    });

    expect(result.current.isAllSelected).toBe(false);
    expect(result.current.selectedCount).toBe(0);
  });

  it("should handle multiple selections", () => {
    const { result } = renderHook(() => useSelection({ items: testItems }));

    act(() => {
      result.current.toggle("1");
      result.current.toggle("3");
    });

    expect(result.current.selectedCount).toBe(2);
    expect(result.current.isSelected("1")).toBe(true);
    expect(result.current.isSelected("2")).toBe(false);
    expect(result.current.isSelected("3")).toBe(true);
  });

  it("should handle empty items array", () => {
    const { result } = renderHook(() => useSelection<TestItem>({ items: [] }));

    expect(result.current.selectedCount).toBe(0);
    expect(result.current.isAllSelected).toBe(false);

    act(() => {
      result.current.selectAll();
    });

    expect(result.current.selectedCount).toBe(0);
  });

  it("should return selected items array", () => {
    const { result } = renderHook(() => useSelection({ items: testItems }));

    act(() => {
      result.current.toggle("1");
      result.current.toggle("3");
    });

    expect(result.current.selectedItems).toHaveLength(2);
    expect(result.current.selectedItems.map((i) => i.id)).toContain("1");
    expect(result.current.selectedItems.map((i) => i.id)).toContain("3");
  });

  it("should provide isAllSelected indicator", () => {
    const { result } = renderHook(() => useSelection({ items: testItems }));

    expect(result.current.isAllSelected).toBe(false);

    act(() => {
      result.current.toggle("1");
      result.current.toggle("2");
    });

    expect(result.current.isAllSelected).toBe(false);

    act(() => {
      result.current.toggle("3");
    });

    expect(result.current.isAllSelected).toBe(true);
  });

  it("should provide isPartiallySelected indicator", () => {
    const { result } = renderHook(() => useSelection({ items: testItems }));

    expect(result.current.isPartiallySelected).toBe(false);

    act(() => {
      result.current.toggle("1");
    });

    expect(result.current.isPartiallySelected).toBe(true);

    act(() => {
      result.current.toggle("2");
      result.current.toggle("3");
    });

    // All selected, so not partially selected
    expect(result.current.isPartiallySelected).toBe(false);
  });

  it("should update selected items when items prop changes", () => {
    const { result, rerender } = renderHook(
      ({ items }) => useSelection({ items }),
      { initialProps: { items: testItems } }
    );

    act(() => {
      result.current.toggle("1");
      result.current.toggle("2");
    });

    expect(result.current.selectedCount).toBe(2);

    // Rerender with new items (item 2 removed)
    const newItems = [
      { id: "1", name: "Item 1" },
      { id: "3", name: "Item 3" },
    ];

    rerender({ items: newItems });

    // Selection state persists, but selectedItems filters correctly
    expect(result.current.selectedItems).toHaveLength(1);
    expect(result.current.selectedItems[0].id).toBe("1");
  });

  it("should handle toggleAll when partially selected", () => {
    const { result } = renderHook(() => useSelection({ items: testItems }));

    act(() => {
      result.current.toggle("1");
    });

    expect(result.current.isPartiallySelected).toBe(true);

    // Toggle all should select all when partially selected
    act(() => {
      result.current.toggleAll();
    });

    expect(result.current.isAllSelected).toBe(true);
    expect(result.current.selectedCount).toBe(3);
  });

  it("should return selectedIds as array", () => {
    const { result } = renderHook(() => useSelection({ items: testItems }));

    act(() => {
      result.current.select("2");
      result.current.select("1");
    });

    expect(Array.isArray(result.current.selectedIds)).toBe(true);
    expect(result.current.selectedIds).toContain("1");
    expect(result.current.selectedIds).toContain("2");
  });
});
