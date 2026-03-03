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

### ✅ Step 11 (Bonus): Nested DataTable in PopperTableCell

Replace the plain text content in `PopperTableCell`'s `<PopoverContent>` with a nested
`<DataTable>` that has its own keyboard navigation, lazy-loaded data, and deep-chain
edit persistence.

#### Architecture decisions

**Data persistence — NestedDataStore context**

Nested `PopperCell` components unmount when their parent popover closes, so component
state cannot be used for persistence. Instead, a `NestedDataStore` context backed by a
`useRef<Map<string, TableData[]>>` stores all nested table data at the root level.
The ref never changes identity → sibling consumers do not re-render when any one path changes.

Split into separate files in `src/data/nestedDataStore/`:

- `NestedDataStore.ts` — the Map-backed store class
- `NestedDataStoreContext.ts` — the React context
- `NestedDataStoreProvider.tsx` — context provider (wraps root DataTable)
- `useNestedDataStore.ts` — hook (throws if used outside provider)

The context exposes two stable callbacks:

```ts
const { getData, setData } = useNestedDataStore()
getData(path: string): TableData[] | null
setData(path: string, rows: TableData[]): void
```

**Path key format**

Each path segment is `rowId:colKey`, joined with `/` for deeper nesting:

```
level 1:  "row-1:more"
level 2:  "row-1:more/row-2:more"
level 3:  "row-1:more/row-2:more/row-3:more"
```

`DataTable` receives an optional `basePath=""` prop; `DataTableCell` computes each
`PopperCell`'s path as `basePath ? basePath + "/" + rowId + ":" + colKey : rowId + ":" + colKey`.

**Lazy initialization — simulate async AJAX**

`PopperCell` holds `nestedData: TableData[] | null` in local state (null = not yet loaded).
On first open, calls `getData(cellPath)`:

- If found in store → use stored rows.
- If not found → `generateData()` (5 rows with company + revenue), `setData(cellPath, rows)`.

**Edit persistence chain**

```
TextCell.onChange(value)
  → DataTable.onCellChange(rowIndex, colKey, value)
    → PopperCell.handleNestedCellChange → setNestedData + setData(cellPath, updatedRows)
```

**Nested DataTable columns**

```ts
const nestedColumns: ColumnDefinition[] = [
  { key: "company", header: "Company", type: "text" },
  { key: "revenue", header: "Revenue", type: "number", format: "currency" },
  { key: "more", header: "More", type: "popper", triggerText: "More" },
];
```

**Escape propagation**

`DataTable`'s `handleKeyDown` calls `e.stopPropagation()` before processing keys, so Escape in
a nested DataTable deselects only that table's active cell and doesn't bubble to ancestors.
Radix's `DismissableLayer` closes the popover separately via document-level Escape.

**Focus — Tab containment**

Radix `PopoverContent` creates a focus scope that traps Tab inside the portal. Tab navigation
inside nested DataTables does not leak to the parent table.

---

### ✅ Step 12: Codebase refactor — extracted hooks + `DataTableCell` dispatcher

After the bonus was working, the code was restructured for clarity.

**Files reorganized:**

- Cells moved into `src/components/table/cells/`
- Cell hooks extracted to `src/components/table/cells/hooks/`
- Navigation hook extracted to `src/components/table/hooks/`
- NestedDataStore split into `src/data/nestedDataStore/` (4 files)

**New slim cell components** (`TextCell`, `NumberCell`, `BoolCell`, `PopperCell`) replace the
`*TableCell` originals as the canonical implementations. The `*TableCell` files remain and
continue to pass their original test suites.

**`DataTableCell`** (`src/components/table/cells/DataTableCell.tsx`) — a `memo`-wrapped
dispatcher that reads `column.type` and renders the appropriate `*Cell`. `DataTable` no longer
contains the type switch; it passes column + row to `DataTableCell` and lets it dispatch.

**`useEditableCell`** (`src/components/table/cells/hooks/useEditableCell.ts`) — extracts the
shared logic from `TextCell` and `NumberCell`: `localValue` state, `inputRef` auto-focus,
`exitAndCommit`, and `handleKeyDown`.

**`useCellKeyboard`** extracted to its own file
(`src/components/table/cells/hooks/useCellKeyboard.ts`) — previously lived in `CellShell.tsx`.

---

## Test Summary

All files under `src/components/table/` unless otherwise noted.

| File                                            | Tests   | Status        |
| ----------------------------------------------- | ------- | ------------- |
| `DataTable.test.tsx`                            | 23      | ✅ Passing    |
| `DataTable.integration.test.tsx`                | 2       | ✅ Passing    |
| `DataTableCell.test.tsx`                        | 18      | ✅ Passing    |
| `TextTableCell.test.tsx`                        | 14      | ✅ Passing    |
| `NumberTableCell.test.tsx`                      | 15      | ✅ Passing    |
| `BoolTableCell.test.tsx`                        | 14      | ✅ Passing    |
| `PopperTableCell.test.tsx`                      | 23      | ✅ Passing    |
| `CellShell.test.tsx`                            | 24      | ✅ Passing    |
| `hooks/useCellKeyboard.test.tsx`                | 10      | ✅ Passing    |
| `hooks/useEditableCell.test.tsx`                | 10      | ✅ Passing    |
| `hooks/useTableNavigation.test.ts`              | 35      | ✅ Passing    |
| `hooks/useTableNavigation.integration.test.tsx` | 4       | ✅ Passing    |
| `data/nestedDataStore/NestedDataStore.test.tsx` | 8       | ✅ Passing    |
| `data/generateData.test.ts`                     | 11      | ✅ Passing    |
| `test-setup.test.ts`                            | 2       | ✅ Passing    |
| **Total**                                       | **213** | **All green** |

Run tests: `pnpm test` (watch) or `pnpm test:run` (single pass)

---

### ✅ Step 13 — Programmatic focus support for cells

**Problem**

External tools — Chrome DevTools "Focus" button, screen readers, accessibility
testing tools, or `element.focus()` from external scripts — cannot meaningfully
target individual cells. The `<td>` elements have no `tabIndex`, so they aren't
focusable. Even when focus does land on a cell, the table has no listener to
detect it and update `activeCell`. The result: programmatic focus produces no
visual feedback, no navigation state change, and no popper cleanup.

Additionally, when programmatic focus lands on a root-level cell while nested
poppers are open, the resulting state cascade (popper closes → nested DataTable
unmounts → `exitEdit` fires → `wrapperRef.focus()`) causes each nested
DataTable to compete for focus. The last `exitEdit` focuses a wrapper that is
about to be unmounted, so focus falls to `document.body`.

**Solution**

Four changes address cell focusability, and a fifth addresses the nested focus
cascade:

1. **Make cells focusable**: `tabIndex={-1}` on the `<td>` in `CellShell` and
   `PopperCell`. Cells become targetable by programmatic focus without entering
   the Tab order (keyboard navigation stays on the wrapper div).

2. **Bridge DOM focus into logical state**: `onFocus` handlers on `CellShell`
   and `PopperCell` call `onSelect()` when the cell receives direct DOM focus
   (guarded by `e.target === e.currentTarget` and `!isSelected`). `PopperCell`
   additionally uses a `pointerDownRef` flag to distinguish click-triggered
   focus from programmatic focus (see Key decisions below).

3. **Close stale poppers on focus change**: A `useEffect` in `PopperCell` sets
   `open` to `false` when `isEditing` becomes false. When programmatic focus
   moves to a different cell, `activeCell` updates, the old popper cell's
   `isEditing` prop flips to false, and the popover closes. The cascade is
   automatic: closing the popover unmounts `PopoverContent`, which unmounts
   any nested DataTable and any deeper poppers.

4. **Guard the wrapper's `handleFocus`**: Added `e.target !== e.currentTarget`
   check so focus events bubbling from child cells don't trigger the wrapper's
   auto-select-first-cell logic.

5. **FocusCoordinator**: A React context (`FocusCoordinator.tsx`) that
   coordinates focus across nested DataTable instances. It exposes three
   methods: `claimFocus(wrapper)`, `canFocus(wrapper)`, and `releaseClaim()`.
   `selectCell` claims focus before calling `wrapper.focus()`, so that when
   the cascading `exitEdit` calls check `canFocus()`, they yield instead of
   competing. The root DataTable provides the context; nested DataTables
   (inside Radix portals) share it because React context follows the
   component tree, not the DOM tree.

**Files changed**

- `CellShell.tsx` — `tabIndex={-1}`, `onFocus` handler, `data-selected` and
  `data-editing` attributes. `onClick` only handles the edit transition.
- `PopperCell.tsx` — `tabIndex={-1}`, `onFocus` with `pointerDownRef` guard,
  `useEffect` for `isEditing`→`open` sync, `onCloseAutoFocus` prevention on
  `PopoverContent`, `onEscapeKeyDown` guard for nested editing cells.
- `useTableNavigation.ts` — `handleFocus` target guard. `selectCell` uses
  coordinator claim/release and synchronous `wrapper.focus()`. `exitEdit`
  checks `coordinator.canFocus()` before focusing.
- `FocusCoordinator.tsx` — New file. React context with `claimFocus`,
  `canFocus`, `releaseClaim`.
- `DataTable.tsx` — Split into `DataTable` (thin wrapper that provides
  `FocusCoordinatorProvider` when no parent coordinator exists) and
  `DataTableContent` (all rendering/hook logic). Nested DataTables detect
  the existing coordinator via `useFocusCoordinator()` and skip the wrapper.

**Key decisions**

- **CellShell selection via `onFocus`**: Clicking a cell triggers mousedown →
  browser focus → `onFocus` → `onSelect`. `onClick` only handles the edit
  transition (already-selected cell → editing mode). This single path handles
  both click and programmatic focus.

- **PopperCell `pointerDownRef` guard**: PopperCell uses `onClickCapture`
  (not `onClick`), and React 18 flushes state between `mousedown` (where
  `onFocus` fires) and `click` (where `onClickCapture` fires). Without a
  guard, a single click both selects AND enters editing mode. The
  `pointerDownRef` distinguishes click-triggered focus from programmatic
  focus: `onPointerDown` sets the flag, `onFocus` skips `onSelect` when the
  flag is set, and `onClickCapture` handles both selection and edit in a
  single React batch.

- **Context-based coordination (not module-level)**: Multiple independent
  DataTables on a page need separate focus coordination. Each root DataTable
  provides its own `FocusCoordinatorProvider`; nested tables within each root
  share it via context. React context traverses the component tree (not the
  DOM), so it works correctly across Radix portal boundaries.

- **Synchronous focus (no `requestAnimationFrame`)**: The coordinator
  prevents nested `exitEdit` from competing, and the root wrapper is outside
  the Radix portal being unmounted, so async deferral is unnecessary.

- **happy-dom limitation**: `toHaveFocus()` is unreliable in happy-dom for
  scenarios involving programmatic focus during popover close cascades
  (Radix unmount timing differs from real browsers). Tests use `data-selected`
  assertions; focus behavior verified manually in Chrome.

- 13 tests added across 5 files; all 213 tests pass.

---

### ✅ Step 14 — Unified data layer via NestedDataStore

**Problem**

Data management was split across two mechanisms: the root table required its
parent (`App.tsx`) to hold `useState` + `onCellChange`, while nested tables
used `NestedDataStore` for persistence across mount/unmount cycles. This meant
two separate code paths for the same concern, and the root table couldn't
persist edits without explicit wiring in the host component.

**Solution — root table is the N+1th store entry**

`DataTable` now self-manages its data via `NestedDataStore`. Every table
(root or nested) is just another entry in the store, keyed by `basePath`.

**DataTable changes** (`DataTable.tsx`)

- Imports `useNestedDataStore` and adds internal `useState<TableData[]>`
- State initialiser: `getData(basePath) ?? seedData` — prefers stored data,
  falls back to the `data` prop as initial seed
- On cell edit: updates local state + calls `storeSet(basePath, updated)`
- `data` prop is now optional (defaults to `[]`); `onCellChange` remains as
  an optional notification callback for parents that want to observe edits
- Tests without `NestedDataStoreProvider` get `noopStore` (getData → null,
  setData → no-op), so DataTable falls back to the `data` prop — existing
  tests pass unmodified

**PopperTableCell changes** (`PopperTableCell.tsx`)

- Removed `nestedData` state and `handleNestedCellChange` callback
- Uses a `seedRef` to hold generated data and passes it as the `data` prop
  to the nested `DataTable` (fallback for tests without a store provider)
- Uses a `loaded` boolean instead of `nestedData !== null` for the
  loading/ready toggle
- No longer passes `onCellChange` — DataTable handles edits internally

**App.tsx changes**

- Removed `useState` and `handleCellChange`
- Passes `data={initialData}` as seed; DataTable persists edits via the store

**Test changes** (`PopperTableCell.test.tsx`)

- Added `NestedDataStoreProvider` import and `withStore` option to `setup()`
- Tests that verify data persistence across popover close/reopen now use
  `{ withStore: true }` and pass unique `cellPath` values
- Replaced "handles nested data change when nestedData is null" test
  (tested removed functionality) with "allows editing cells in the nested
  table" test
- All 213 tests pass

---

### ✅ Step 15 — Performance optimization

**Problem**

Navigation (arrow keys, Tab, click) feels sluggish in Chrome. Every navigation
event re-renders **all** R×C cells instead of just the 2 affected cells (old
selection + new selection). Root causes:

1. `activeCell` state object in the `useMemo` dependency array for `rows`
2. Inline arrow function closures (`() => selectCell(r, c)`) defeating `React.memo`
3. `handleCellChange` closing over `activeCell` (new reference every nav)
4. `handleFocus`/`handleKeyDown` closing over `activeCell` (unstable references)
5. `exitAndCommit` in `useEditableCell` recreated on every keystroke
6. `NestedDataStoreProvider` context value is an inline object literal
7. `Intl.NumberFormat` re-constructed on every render of `NumberTableCell`

**Solution — `useSyncExternalStore` + stable callbacks**

Replaced `useState<ActiveCell>` with a lightweight pub/sub `ActiveCellStore`.
Each cell subscribes via `useSyncExternalStore` with a primitive string selector
(`"none"` / `"selected"` / `"editing"`). Only cells whose derived state actually
changes re-render — O(2) per navigation instead of O(R×C).

All callbacks that previously closed over `activeCell` now read from the store
synchronously via `store.getSnapshot()`, making them stable references.

**New file:** `src/components/table/hooks/ActiveCellStore.ts`

- `ActiveCellStore` class — holds `ActiveCell`, pub/sub via `subscribe()`
- `createActiveCellStore()` — factory function
- `useCellState(store, rowIndex, colIndex)` — hook that subscribes a cell and
  returns `{ isSelected, isEditing }` using `useSyncExternalStore`

**Files changed**

- `useTableNavigation.ts` — accepts `store: ActiveCellStore` parameter instead
  of creating internal `useState`. All callbacks (`navigate`, `selectCell`,
  `editCell`, `exitEdit`, `handleFocus`, `handleKeyDown`) read from the store at
  call time, making them stable. `handleKeyDown` guards against bubbled events
  from child elements (`e.target !== e.currentTarget`) to prevent double-handling
  after the cell's own keyboard handler has already updated the store.
- `DataTable.tsx` — creates store via `useRef(createActiveCellStore()).current`.
  `handleCellChange` reads from store instead of closing over `activeCell`.
  Render loop passes `store`, `colIndex`, `selectCell`, `editCell` as stable
  props to `DataTableCell` (replacing inline closures and `isSelected`/`isEditing`).
  `useMemo` deps are all stable across navigation events.
- `DataTableCell.tsx` — subscribes via `useCellState(store, rowIndex, colIndex)`.
  Derives `isSelected`/`isEditing` internally. Creates stable `onSelect`/`onEdit`
  callbacks with `useCallback`. Child cell components (Text/Number/Bool/Popper)
  receive the same `CellProps` interface — no changes needed.
- `useEditableCell.ts` — `editingValueRef` stores the editing value so
  `exitAndCommit` doesn't depend on `editingValue` in its deps. Stable during
  typing.
- `NestedDataStoreProvider.tsx` — wrapped context value in `useMemo` so
  consumers don't re-render when the provider re-renders.
- `NumberTableCell.tsx` — memoized `Intl.NumberFormat` instance with `useMemo`.

**Key decision — bubbled event guard**

With `useState`, `handleKeyDown` closed over the stale `activeCell` value. When
a cell's input handled Escape (calling `exitEdit`), the event bubbled to the
wrapper's `handleKeyDown`, which still saw `mode: "editing"` and returned early.
With the store, `handleKeyDown` reads the live value — by the time the bubbled
event arrives, `exitEdit` has already updated the store to `mode: "selected"`,
so the wrapper would handle Escape again and clear the selection. The guard
`if (e.target !== e.currentTarget) return;` ensures the wrapper only processes
events that target it directly.

**Tests**

- `ActiveCellStore.test.ts` — 11 new tests (store class + `useCellState` hook)
- `useTableNavigation.test.ts` — 35 tests updated to use `store.getSnapshot()`
- `DataTable.test.tsx` — 26 tests pass unchanged (mocks still receive
  `isSelected`/`isEditing` from `DataTableCell`)
- `DataTableCell.test.tsx` — 18 tests updated to provide store + `selectCell`/`editCell`
- `useEditableCell.test.tsx` — 11 tests pass unchanged
- Integration tests — 2 tests pass (deep-chain persistence, programmatic focus)
- All 229 tests pass

---

### Step 16 — Reactive DOM focus tracking via `useFocusWithin`

**Problem**

The store-driven focus model (ActiveCellStore + FocusCoordinator) handles all
focus transitions that go through known code paths — cell clicks, keyboard
navigation, Radix popover events. But it is blind to external focus changes:
browser Find in Page, assistive technology, third-party libraries calling
`.focus()`, or DevTools interaction. When DOM focus moves through an
unexpected path, the store remains stale and poppers don't close.

The 2026-02-23 branch had `useFocusWithin`, a reactive DOM focus tracker that
listens to global `focusin`/`focusout`, builds a logical tree via React
context (works across portals), and fires `onClose` when focus leaves a
subtree. That resilience was lost when we adopted the slimmer
ActiveCellStore + FocusCoordinator architecture.

**Solution — add `useFocusWithin` alongside FocusCoordinator**

FocusCoordinator stays — it solves a proactive, synchronous problem (mutex
during cascading teardown). `useFocusWithin` solves a reactive problem
(observe DOM focus changes after they happen). They complement each other.

`useFocusWithin` is scoped to **PopperTableCell** only — regular cells
already have `onFocus` handlers that update the store, and visual rings are
store-driven. Popper cells need reactive tracking because their close
behavior must respond to focus leaving a logical subtree that spans a portal.

**`useFocusWithin` design** (`src/components/table/hooks/useFocusWithin.tsx`)

Adapted from 2026-02-23 with one improvement: **listener cleanup** — when
the registry empties, global `focusin`/`focusout` listeners are removed and
the blur timeout is cleared (2026-02-23 version never cleaned up).

- Module-level `Map<string, Entry>` registry
- `isInLogicalSubtree(id, element)` — recursive DOM `.contains()` through
  logical children
- `notifyFocusChange()` — builds focus path set, updates `setFocused`, fires
  `onClose` with `focusMovedToKnownElement` guard (only fires when focus
  moves to another registered element, not to arbitrary external elements)
- `useLayoutEffect` for registration (synchronous, before Radix auto-focus)
- `FocusWithinContext` for parent-child linking across portals
- Returns `{ isFocusedWithin, ref, Wrapper }`

**PopperTableCell integration** (`src/components/table/PopperTableCell.tsx`)

Three changes:
1. `useFocusWithin({ onClose })` — closes popover and calls `onExitEdit` when
   focus leaves the cell's logical subtree (guarded by `if (open)`)
2. `ref={focusRef}` on `<TableCell>` — registers the cell in the focus registry
3. `<Wrapper>` around PopoverContent children — establishes the logical
   parent-child link across the Radix portal boundary

All existing close mechanisms remain unchanged (Radix `onOpenChange`,
`isEditing` effect, `onEscapeKeyDown` guard).

**Files changed**

- `src/components/table/hooks/useFocusWithin.tsx` — NEW
- `src/components/table/hooks/useFocusWithin.test.tsx` — NEW
- `src/components/table/PopperTableCell.tsx` — MODIFIED
- `src/components/table/PopperTableCell.test.tsx` — MODIFIED

---

## Test Summary

All files under `src/components/table/` unless otherwise noted.

| File                                            | Tests   | Status        |
| ----------------------------------------------- | ------- | ------------- |
| `DataTable.test.tsx`                            | 26      | ✅ Passing    |
| `DataTable.integration.test.tsx`                | 2       | ✅ Passing    |
| `DataTableCell.test.tsx`                        | 18      | ✅ Passing    |
| `TextTableCell.test.tsx`                        | 14      | ✅ Passing    |
| `NumberTableCell.test.tsx`                      | 15      | ✅ Passing    |
| `BoolTableCell.test.tsx`                        | 14      | ✅ Passing    |
| `PopperTableCell.test.tsx`                      | 23      | ✅ Passing    |
| `CellShell.test.tsx`                            | 25      | ✅ Passing    |
| `hooks/useCellKeyboard.test.tsx`                | 10      | ✅ Passing    |
| `hooks/useEditableCell.test.tsx`                | 11      | ✅ Passing    |
| `hooks/useTableNavigation.test.ts`              | 35      | ✅ Passing    |
| `hooks/useTableNavigation.integration.test.tsx` | 4       | ✅ Passing    |
| `hooks/ActiveCellStore.test.ts`                 | 11      | ✅ Passing    |
| `data/nestedDataStore/NestedDataStore.test.tsx`  | 8       | ✅ Passing    |
| `data/generateData.test.ts`                     | 11      | ✅ Passing    |
| `test-setup.test.ts`                            | 2       | ✅ Passing    |
| **Total**                                       | **229** | **All green** |

---

## Known Issues / Flagged Items

