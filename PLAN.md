# Implementation Plan & Log

This file tracks the implementation of Excel-like cell navigation for the frontend interview assignment.
It serves as both a historical record and a handoff document for future agents.

For project behavior rules, see `claude-behavior.md`.
For assignment requirements, see `README.md`.

---

## Overview

The goal is to make the static data table behave like a spreadsheet: cells can be selected and edited
via keyboard and mouse. Four cell types exist — Text, Number, Bool, and Popper — each with their own
editing behavior. Navigation state (`selected` / `editing`) lives in `DataTable` and flows down as
props.

---

## Steps

### ✅ Step 1: Test Infrastructure

**Files changed:** `vite.config.ts`, `tsconfig.app.json`, `package.json`, `src/test-setup.ts`

**What was done:**

- Added `vitest` config block to `vite.config.ts` with `happy-dom` as the DOM environment
- Added `src/test-setup.ts` importing `@testing-library/jest-dom`
- Added `"test": "vitest"` and `"test:run": "vitest run"` scripts to `package.json`
- Added `"vitest/globals"` to `tsconfig.app.json` types array

**Dependencies added (flagged for review):**

- `vitest` — test runner, pairs naturally with the existing Vite setup
- `@testing-library/react` — component testing
- `@testing-library/user-event` — realistic user interaction simulation
- `@testing-library/jest-dom` — DOM matchers
- `happy-dom` — DOM environment

**Issues:**

- Initially attempted `jsdom` but `jsdom@28` has an ESM incompatibility (`html-encoding-sniffer`
  uses `require()` on an ESM module). Switched to `happy-dom` which works cleanly.
- Node version issue: user added `.nvmrc` set to `25` (Node 25.7.0); `pnpm` was not installed
  under that version. Resolved by running `corepack enable`.

---

### ✅ Step 2: Navigation Types

**File changed:** `src/components/table/types.ts`

**What was done:**
Added four types needed for the navigation system:

- `CellMode` — `"selected" | "editing"`
- `ActiveCell` — `{ row, col, mode } | null`
- `NavigationDirection` — `"up" | "down" | "left" | "right" | "next" | "prev"`
- `CellProps` — the full prop contract all cell components implement

**Flagged but not fixed:** Pre-existing `any` in `ColumnDefinition<T = any>` and `TableData`.
These are lint errors but outside the scope of this task.

---

### ✅ Step 3: DataTable — State & Keyboard Navigation

**Files changed:** `src/components/table/DataTable.tsx`, `src/components/table/DataTable.test.tsx`

**What was done:**

- Added `useState<ActiveCell>(null)` for active cell tracking
- Added `useRef<HTMLDivElement>` on the table wrapper so `onSelect` and `onExitEdit` can return
  keyboard focus to the wrapper (required for arrow key navigation after clicking a cell)
- Implemented `navigate(direction)` using `setActiveCell` with a functional update to avoid
  stale closures
- Implemented `handleKeyDown` which handles all navigation keys in `selected` mode and is a
  no-op in `editing` mode (editing cells handle their own keyboard events)
- The wrapper div has `tabIndex={0}` and `className="outline-none"` (cells show their own rings)
- 22 tests written and passing: initial state, click selection, arrow keys, Tab/Shift+Tab,
  Enter/Escape, boundary conditions, editing-mode passthrough, `onExitEdit` callback

**Key decisions:**

- `navigate()` uses functional `setActiveCell` to be safe from stale closures without adding
  it to `useCallback` deps — this keeps the function reference stable across renders
- `onSelect` calls `wrapperRef.current?.focus()` so clicking a cell also returns keyboard focus
  to the wrapper; without this, arrow keys don't work until the user clicks the wrapper
- Cell mocks in tests expose `data-selected` and `data-editing` attributes and use
  `onClick`/`onDoubleClick` to trigger `onSelect`/`onEdit` — this tests DataTable's state logic
  in isolation from the cell implementations

---

### ✅ Step 4: TextTableCell

**Files changed:** `src/components/table/TextTableCell.tsx`,
`src/components/table/TextTableCell.test.tsx`

**What was done:**

- Added `CellProps` to component signature
- Added `useState(value)` for local editable state
- Added `useRef<HTMLInputElement>` + `useEffect` to focus/select input on `isEditing` change
- Click: first click → `onSelect()`, second click → `onEdit()`
- Input `onBlur` → `onExitEdit()`
- Input keydown: Enter → `onExitEdit()` + navigate down; Tab → navigate next/prev; Escape → exit
- Ring styling: blue-400 (selected), blue-600 (editing)
- 15 tests written and passing

**Issues:**

- Tests and implementation were written simultaneously instead of stopping for review after
  tests (TDD violation). This led to updates in `claude-behavior.md` strengthening the TDD gate.

---

### ✅ Step 5: NumberTableCell

**Files changed:** `src/components/table/NumberTableCell.tsx`,
`src/components/table/NumberTableCell.test.tsx`

**What was done:**

- Same pattern as TextTableCell but `type="number"` input
- `formatValue()` handles `currency`, `percentage`, `decimal`, and default locale formatting
- 11 tests written and passing

---

### ✅ Step 6: BoolTableCell

**Files changed:** `src/components/table/BoolTableCell.tsx`,
`src/components/table/BoolTableCell.test.tsx`

**What was done:**

- Selected: ring styling on `<td>`
- Editing: renders a `<select>` with ✓ True / ✗ False options
- `onChange` → updates local value + calls `onExitEdit()` (selection is a single gesture)
- Blur, Escape, Tab all call `onExitEdit()`
- 13 tests written and passing

**Key decision:** User explicitly requested a dropdown (select element) in edit mode rather than
the initially-planned immediate-toggle approach.

---

### ✅ Step 7: PopperTableCell

**Files changed:** `src/components/table/PopperTableCell.tsx`,
`src/components/table/PopperTableCell.test.tsx`

**What was done:**

- Three-step interaction: click → selected; second click or Enter → editing (button focused);
  Enter on button → popover opens
- `onClickCapture` on the `<TableCell>` intercepts clicks in capture phase when not editing,
  preventing Radix button from activating on the first click
- `useEffect` focuses the button ref when `isEditing && !open`
- Button has `tabIndex={isEditing ? 0 : -1}` to exclude it from natural tab order in non-editing mode
- `handleOpenChange` calls `onExitEdit()` whenever the popover closes (Radix handles external
  focus automatically via its default close-on-focus-outside behavior)
- Ring: blue-400 when selected only; blue-600 when `isEditing || open`
- 12 tests written and passing

**Issues:**

- ESLint `no-unused-expressions` error on the ternary `isSelected ? onEdit?.() : onSelect?.()`.
  Fixed by converting to an `if/else` block.
- Pre-existing lint error in `button.tsx` (`react-refresh/only-export-components`) — flagged,
  out of scope.

---

### ✅ Step 8: Tab-into-table focus

**Files changed:** `src/components/table/DataTable.tsx`, `src/components/table/DataTable.test.tsx`

**What was done:**

- Added `handleFocus` callback on the wrapper div's `onFocus` prop
- When `activeCell` is null and focus arrives from outside the wrapper
  (`!e.currentTarget.contains(e.relatedTarget)`), selects `{row: 0, col: 0, mode: "selected"}`
- When focus returns to the wrapper after exiting edit mode, `activeCell` is non-null (the focus
  event fires synchronously before React flushes the queued state update), so the guard correctly
  does nothing and the previously selected cell is preserved
- 2 tests added and passing

---

### ✅ Step 9: Orange border in edit mode

**Files changed:** `src/components/table/TextTableCell.tsx`, `src/components/table/NumberTableCell.tsx`,
`src/components/table/BoolTableCell.tsx`, `src/components/table/PopperTableCell.tsx`
(plus the corresponding `.test.tsx` files)

**What was done:**

- Replaced `ring-blue-600` with `ring-orange-500` in all four cell components
- Updated the corresponding test in each file; added a `not.toMatch(/ring-blue-600/)` assertion
- `PopperTableCell`'s open-popover ring test also updated to orange
- 5 test updates, all passing

---

### ✅ Step 10: Shared cell abstractions (`CellShell` + `useCellKeyboard`)

**Files changed:** `src/components/table/CellShell.tsx` (new),
`src/components/table/CellShell.test.tsx` (new),
`src/components/table/TextTableCell.tsx`,
`src/components/table/NumberTableCell.tsx`,
`src/components/table/BoolTableCell.tsx`,
`src/components/table/PopperTableCell.tsx`

**What was done:**

- Created `CellShell.tsx` exporting two utilities:
  - `useCellKeyboard({ onExitEdit, onNavigate, enterNavigates? })` — returns `handleKeyDown` covering Escape, Tab/Shift+Tab, and optionally Enter. Text/Number pass `enterNavigates: true`; Bool/Popper omit it (default false, leaving Enter to native element behavior)
  - `CellShell` component — wraps `<TableCell>` with the ring className logic (`ring-blue-400` selected, `ring-orange-500 p-0` editing) and the `onClick` select/edit toggle. Used by Text, Number, Bool
- Popper imports only `useCellKeyboard` (not `CellShell`) because its ring logic includes `!open` / `(isEditing || open)` and it uses `onClickCapture` instead of `onClick` — parameterizing those differences into `CellShell` would be worse than the duplication
- 20 tests added in `CellShell.test.tsx`; all 93 tests pass with no changes to any existing test

**Key decision:** One new file (not two) for both exports — they are small, always co-used, and the behavior file prefers minimal file creation.

---

## Remaining

### ✅ Lint: Fix `any` types in `types.ts`

Changed `ColumnDefinition<T = any>` → `<T = unknown>`, `accessor` return type → `unknown`,
and `TableData { [key: string]: any }` → `unknown`. All 93 tests still pass.

---

### ⬜ Step 11 (Bonus): Nested DataTable in PopperTableCell

Replace the plain text content in `PopperTableCell`'s `<PopoverContent>` with a nested
`<DataTable>` that has its own keyboard navigation, lazy-loaded data, and deep-chain
edit persistence.

#### Architecture decisions

**Data persistence — NestedDataStore context**

Nested `PopperTableCell` components unmount when their parent popover closes, so component
state cannot be used for persistence. Instead, a `NestedDataStore` context backed by a
`useRef<Map<string, TableData[]>>` stores all nested table data at the root `DataTable` level.
The ref never changes identity → sibling consumers do not re-render when any one path changes.

The context exposes two stable callbacks (empty `useCallback` deps):
```ts
const { getData, setData } = useNestedDataStore()
getData(path: string): TableData[] | null
setData(path: string, rows: TableData[]): void
```

**Path key format**

Each path segment is `rowId:colKey`, joined with `/` for deeper nesting:
```
level 1:  "outer-r1:info"
level 2:  "outer-r1:info/row-1:more"
level 3:  "outer-r1:info/row-1:more/row-1:more"
```

`DataTable` receives an optional `basePath=""` prop and computes each `PopperTableCell`'s
path as `basePath ? basePath + "/" + rowId + ":" + colKey : rowId + ":" + colKey`.
Row IDs come from each row's `id` field (already present in `TableData`).

**Lazy initialization — simulate async AJAX**

`PopperTableCell` holds `nestedData: TableData[] | null` in local state (null = not yet loaded).
On first open: render a `"Loading…"` placeholder, call `getData(cellPath)`:
- If found in store → `setNestedData(storedRows)`.
- If not found → generate 5 rows with `generateData(value)`, call `setData(cellPath, rows)`,
  then `setNestedData(rows)`.

Because happy-dom / JSDOM resolves synchronously, the loading flash is invisible in tests.

**Edit persistence chain**

```
TextTableCell.onChange(value)
  → DataTable.onCellChange(rowIndex, colKey, value)
    → PopperTableCell updates its local nestedData state
    → calls setData(cellPath, updatedRows) to persist in the store
```

Each cell type (`TextTableCell`, `NumberTableCell`, `BoolTableCell`) receives an optional
`onChange` prop that fires with the new typed value whenever editing commits.

**Nested DataTable columns (generateData)**

The nested table always has three columns so it can support arbitrary nesting depth:
```ts
const nestedColumns: ColumnDefinition[] = [
  { key: "label",  header: "Label",  type: "text" },
  { key: "detail", header: "Detail", type: "text" },
  { key: "more",   header: "More",   type: "popper", triggerText: "More" },
]
```

**Escape propagation**

`DataTable`'s Escape handler calls `setActiveCell(null)` without `e.stopPropagation()`.
Radix's `DismissableLayer` listens at document level and closes the innermost open popover
on the same Escape event. One Escape therefore both deselects the active cell AND closes the
popover. No extra `onEscapeWithNothingSelected` prop is needed.

**Focus — Tab containment**

Radix `PopoverContent` creates a focus scope that traps Tab inside the portal. Tab navigation
inside nested DataTables does not leak to the parent table.

#### Tests written (🔴 red — pending implementation)

**`PopperTableCell.test.tsx`** — fully rewritten. New/updated tests:
- `"opens the popover when Enter is pressed on the focused button"` — now checks for `columnheader "Label"` (nested DataTable) instead of plain text content
- `"does not render table content until the popover is first opened"` — lazy init guard
- `"renders a DataTable with defined columns when the popover opens"` — Label + Detail headers
- `"shows 5 data rows in the nested table"` — 6 rows total (1 header + 5 data)
- `"generates data from the cell value and keeps it stable across opens"` — data from store
- `"preserves cell edits after the popover is closed and reopened"` — edit persistence
- `"closes the popover on Escape when focus is inside the nested table"` — Escape propagation

**`TextTableCell.test.tsx`** — added:
- `"calls onChange with the current value when editing exits"`

**`NumberTableCell.test.tsx`** — added:
- `"calls onChange with the current numeric value when editing exits"`

**`BoolTableCell.test.tsx`** — added:
- `"calls onChange with the new boolean value when a selection is made"`

**`DataTable.test.tsx`** — updated `captured` to include `onChange`, updated TextTableCell mock
to capture it, added:
- `"calls onCellChange with row index, column key, and new value when a cell reports a change"`

**`DataTable.integration.test.tsx`** — new file, single test:
- `"preserves edits at all 3 levels after closing and reopening all poppers"`

#### Implementation checklist (next session)

- [ ] **`src/components/table/NestedDataStore.tsx`** (new)
  - `NestedDataStoreContext` with `getData` / `setData` backed by `useRef<Map<string, TableData[]>>`
  - `NestedDataStoreProvider` component — wraps the root DataTable
  - `useNestedDataStore()` hook — throws if used outside provider

- [ ] **`src/components/table/DataTable.tsx`**
  - Add `basePath?: string` prop (default `""`)
  - Add `onCellChange?: (rowIndex: number, key: string, value: unknown) => void` prop
  - Wrap return in `<NestedDataStoreProvider>` (root only — nested DataTables are inside the
    provider already via context inheritance)
  - Pass `onChange` to each cell type in `renderCell`; in `onChange`, call `onCellChange`
  - Compute `cellPath` for each `PopperTableCell`:
    `basePath ? basePath + "/" + rowId + ":" + colKey : rowId + ":" + colKey`
  - Pass `cellPath` and `basePath` to `PopperTableCell`

- [ ] **`src/components/table/TextTableCell.tsx`**
  - Add `onChange?: (value: string) => void` to props
  - Call `onChange(currentValue)` when editing commits (onBlur / Enter / Tab handler)

- [ ] **`src/components/table/NumberTableCell.tsx`**
  - Add `onChange?: (value: number) => void`
  - Call `onChange(Number(inputValue))` when editing commits

- [ ] **`src/components/table/BoolTableCell.tsx`**
  - Add `onChange?: (value: boolean) => void`
  - Call `onChange(value === "true")` when select changes

- [ ] **`src/components/table/PopperTableCell.tsx`**
  - Add `cellPath?: string` prop (passed from DataTable)
  - Replace `useState(false)` for open with `useState<TableData[] | null>(null)` for `nestedData`
  - On open: if `nestedData === null`, run lazy-init (`getData` → hit or generate → `setData`)
  - Render `<DataTable columns={nestedColumns} data={nestedData} basePath={cellPath} onCellChange={handleNestedCellChange} />` inside `PopoverContent`
  - `handleNestedCellChange` updates local `nestedData` state + calls `setData(cellPath, updatedRows)`
  - Keep loading placeholder while `nestedData === null`

---

## Test Summary

| File                               | Tests  | Status                      |
| ---------------------------------- | ------ | --------------------------- |
| `DataTable.test.tsx`               | 23     | 🔴 1 new test (red)         |
| `TextTableCell.test.tsx`           | 14     | 🔴 1 new test (red)         |
| `NumberTableCell.test.tsx`         | 12     | 🔴 1 new test (red)         |
| `BoolTableCell.test.tsx`           | 14     | 🔴 1 new test (red)         |
| `PopperTableCell.test.tsx`         | 18     | 🔴 7 new/updated tests (red) |
| `CellShell.test.tsx`               | 20     | ✅ Passing                  |
| `DataTable.integration.test.tsx`   | 1      | 🔴 New (red)                |
| **Total**                          | **102** | **11 red, 91 green**       |

Run tests: `pnpm test` (watch) or `pnpm test:run` (single pass)

---

## Known Issues / Flagged Items

- `button.tsx` has a `react-refresh/only-export-components` lint warning — pre-existing
- `claude-behavior.md` TDD gate violation during Steps 4–7 (tests and code written simultaneously
  rather than stopping for review after tests). The behavior file was updated as a result.
