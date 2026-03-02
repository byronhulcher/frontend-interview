import { renderHook, act } from "@testing-library/react"
import { vi } from "vitest"
import { useTableNavigation } from "./useTableNavigation"

function setup(numRows = 3, numCols = 4) {
  return renderHook(() => useTableNavigation({ numRows, numCols }))
}

function makeFocusEvent(containsRelatedTarget: boolean) {
  return {
    currentTarget: { contains: () => containsRelatedTarget },
    relatedTarget: {},
  } as unknown as React.FocusEvent<HTMLDivElement>
}

function makeKeyDown(key: string, extras: Partial<React.KeyboardEvent> = {}) {
  return {
    key,
    shiftKey: false,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    ...extras,
  } as unknown as React.KeyboardEvent<HTMLDivElement>
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe("useTableNavigation initial state", () => {
  it("activeCell starts as null", () => {
    const { result } = setup()
    expect(result.current.activeCell).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// selectCell / editCell / exitEdit
// ---------------------------------------------------------------------------

describe("useTableNavigation cell state mutators", () => {
  it("selectCell sets activeCell to selected mode", () => {
    const { result } = setup()
    act(() => result.current.selectCell(1, 2))
    expect(result.current.activeCell).toEqual({ row: 1, col: 2, mode: "selected" })
  })

  it("editCell sets activeCell to editing mode", () => {
    const { result } = setup()
    act(() => result.current.editCell(0, 3))
    expect(result.current.activeCell).toEqual({ row: 0, col: 3, mode: "editing" })
  })

  it("exitEdit reverts editing mode to selected", () => {
    const { result } = setup()
    act(() => result.current.editCell(2, 1))
    act(() => result.current.exitEdit())
    expect(result.current.activeCell).toEqual({ row: 2, col: 1, mode: "selected" })
  })

  it("exitEdit is a no-op when activeCell is null", () => {
    const { result } = setup()
    act(() => result.current.exitEdit())
    expect(result.current.activeCell).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// navigate — directional movement
// ---------------------------------------------------------------------------

describe("useTableNavigation navigate directions", () => {
  it("up decrements row", () => {
    const { result } = setup()
    act(() => result.current.selectCell(2, 1))
    act(() => result.current.navigate("up"))
    expect(result.current.activeCell).toEqual({ row: 1, col: 1, mode: "selected" })
  })

  it("down increments row", () => {
    const { result } = setup()
    act(() => result.current.selectCell(0, 1))
    act(() => result.current.navigate("down"))
    expect(result.current.activeCell).toEqual({ row: 1, col: 1, mode: "selected" })
  })

  it("left decrements col", () => {
    const { result } = setup()
    act(() => result.current.selectCell(1, 2))
    act(() => result.current.navigate("left"))
    expect(result.current.activeCell).toEqual({ row: 1, col: 1, mode: "selected" })
  })

  it("right increments col", () => {
    const { result } = setup()
    act(() => result.current.selectCell(1, 1))
    act(() => result.current.navigate("right"))
    expect(result.current.activeCell).toEqual({ row: 1, col: 2, mode: "selected" })
  })

  it("next increments col within a row", () => {
    const { result } = setup()
    act(() => result.current.selectCell(1, 1))
    act(() => result.current.navigate("next"))
    expect(result.current.activeCell).toEqual({ row: 1, col: 2, mode: "selected" })
  })

  it("next wraps to the first col of the next row", () => {
    const { result } = setup(3, 4)
    act(() => result.current.selectCell(1, 3)) // last col
    act(() => result.current.navigate("next"))
    expect(result.current.activeCell).toEqual({ row: 2, col: 0, mode: "selected" })
  })

  it("prev decrements col within a row", () => {
    const { result } = setup()
    act(() => result.current.selectCell(1, 2))
    act(() => result.current.navigate("prev"))
    expect(result.current.activeCell).toEqual({ row: 1, col: 1, mode: "selected" })
  })

  it("prev wraps to the last col of the previous row", () => {
    const { result } = setup(3, 4)
    act(() => result.current.selectCell(1, 0)) // first col
    act(() => result.current.navigate("prev"))
    expect(result.current.activeCell).toEqual({ row: 0, col: 3, mode: "selected" })
  })

  it("navigate does nothing when activeCell is null", () => {
    const { result } = setup()
    act(() => result.current.navigate("down"))
    expect(result.current.activeCell).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// navigate — boundary clamping
// ---------------------------------------------------------------------------

describe("useTableNavigation navigate boundaries", () => {
  it("up stays at row 0", () => {
    const { result } = setup()
    act(() => result.current.selectCell(0, 1))
    act(() => result.current.navigate("up"))
    expect(result.current.activeCell?.row).toBe(0)
  })

  it("down stays at last row", () => {
    const { result } = setup(3, 4)
    act(() => result.current.selectCell(2, 1))
    act(() => result.current.navigate("down"))
    expect(result.current.activeCell?.row).toBe(2)
  })

  it("left stays at col 0", () => {
    const { result } = setup()
    act(() => result.current.selectCell(1, 0))
    act(() => result.current.navigate("left"))
    expect(result.current.activeCell?.col).toBe(0)
  })

  it("right stays at last col", () => {
    const { result } = setup(3, 4)
    act(() => result.current.selectCell(1, 3))
    act(() => result.current.navigate("right"))
    expect(result.current.activeCell?.col).toBe(3)
  })

  it("next stays at the last cell", () => {
    const { result } = setup(3, 4)
    act(() => result.current.selectCell(2, 3))
    act(() => result.current.navigate("next"))
    expect(result.current.activeCell).toEqual({ row: 2, col: 3, mode: "selected" })
  })

  it("prev stays at the first cell", () => {
    const { result } = setup()
    act(() => result.current.selectCell(0, 0))
    act(() => result.current.navigate("prev"))
    expect(result.current.activeCell).toEqual({ row: 0, col: 0, mode: "selected" })
  })
})

// ---------------------------------------------------------------------------
// handleFocus
// ---------------------------------------------------------------------------

describe("useTableNavigation handleFocus", () => {
  it("selects (0,0) when activeCell is null and focus comes from outside", () => {
    const { result } = setup()
    act(() => result.current.handleFocus(makeFocusEvent(false)))
    expect(result.current.activeCell).toEqual({ row: 0, col: 0, mode: "selected" })
  })

  it("does not change activeCell when already set", () => {
    const { result } = setup()
    act(() => result.current.selectCell(2, 2))
    act(() => result.current.handleFocus(makeFocusEvent(false)))
    expect(result.current.activeCell).toEqual({ row: 2, col: 2, mode: "selected" })
  })

  it("does not select (0,0) when focus moves within the table", () => {
    const { result } = setup()
    act(() => result.current.handleFocus(makeFocusEvent(true)))
    expect(result.current.activeCell).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// handleKeyDown
// ---------------------------------------------------------------------------

describe("useTableNavigation handleKeyDown", () => {
  it("always calls stopPropagation", () => {
    const { result } = setup()
    act(() => result.current.selectCell(1, 1))
    const event = makeKeyDown("ArrowDown")
    act(() => result.current.handleKeyDown(event))
    expect(event.stopPropagation).toHaveBeenCalled()
  })

  it("does nothing (besides stopPropagation) in editing mode", () => {
    const { result } = setup()
    act(() => result.current.editCell(1, 1))
    const event = makeKeyDown("ArrowDown")
    act(() => result.current.handleKeyDown(event))
    expect(result.current.activeCell?.mode).toBe("editing")
    expect(result.current.activeCell?.row).toBe(1)
  })

  it("ArrowUp navigates up", () => {
    const { result } = setup()
    act(() => result.current.selectCell(2, 1))
    act(() => result.current.handleKeyDown(makeKeyDown("ArrowUp")))
    expect(result.current.activeCell?.row).toBe(1)
  })

  it("ArrowDown navigates down", () => {
    const { result } = setup()
    act(() => result.current.selectCell(0, 1))
    act(() => result.current.handleKeyDown(makeKeyDown("ArrowDown")))
    expect(result.current.activeCell?.row).toBe(1)
  })

  it("ArrowLeft navigates left", () => {
    const { result } = setup()
    act(() => result.current.selectCell(1, 2))
    act(() => result.current.handleKeyDown(makeKeyDown("ArrowLeft")))
    expect(result.current.activeCell?.col).toBe(1)
  })

  it("ArrowRight navigates right", () => {
    const { result } = setup()
    act(() => result.current.selectCell(1, 1))
    act(() => result.current.handleKeyDown(makeKeyDown("ArrowRight")))
    expect(result.current.activeCell?.col).toBe(2)
  })

  it("Tab navigates next", () => {
    const { result } = setup()
    act(() => result.current.selectCell(1, 1))
    act(() => result.current.handleKeyDown(makeKeyDown("Tab")))
    expect(result.current.activeCell?.col).toBe(2)
  })

  it("Shift+Tab navigates prev", () => {
    const { result } = setup()
    act(() => result.current.selectCell(1, 2))
    act(() => result.current.handleKeyDown(makeKeyDown("Tab", { shiftKey: true })))
    expect(result.current.activeCell?.col).toBe(1)
  })

  it("Enter enters editing mode", () => {
    const { result } = setup()
    act(() => result.current.selectCell(1, 1))
    act(() => result.current.handleKeyDown(makeKeyDown("Enter")))
    expect(result.current.activeCell?.mode).toBe("editing")
  })

  it("Escape clears activeCell", () => {
    const { result } = setup()
    act(() => result.current.selectCell(1, 1))
    act(() => result.current.handleKeyDown(makeKeyDown("Escape")))
    expect(result.current.activeCell).toBeNull()
  })

  it("unhandled keys do not change state", () => {
    const { result } = setup()
    act(() => result.current.selectCell(1, 1))
    act(() => result.current.handleKeyDown(makeKeyDown("a")))
    expect(result.current.activeCell).toEqual({ row: 1, col: 1, mode: "selected" })
  })
})
