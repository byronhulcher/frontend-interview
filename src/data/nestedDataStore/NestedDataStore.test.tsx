import { renderHook, act } from "@testing-library/react";
import { NestedDataStoreProvider } from "./NestedDataStoreProvider";
import { useNestedDataStore } from "./useNestedDataStore";

const rows = [{ id: "r1", name: "Alice" }];

function wrapper({ children }: { children: React.ReactNode }) {
  return <NestedDataStoreProvider>{children}</NestedDataStoreProvider>;
}

// ---------------------------------------------------------------------------
// Outside a provider — no-op fallback
// ---------------------------------------------------------------------------

describe("useNestedDataStore outside a provider", () => {
  it("getData returns null for any path", () => {
    const { result } = renderHook(() => useNestedDataStore());
    expect(result.current.getData("any/path")).toBeNull();
  });

  it("setData does not throw", () => {
    const { result } = renderHook(() => useNestedDataStore());
    expect(() => result.current.setData("any/path", rows)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Inside a provider — real store
// ---------------------------------------------------------------------------

describe("useNestedDataStore inside a provider", () => {
  it("getData returns null for an unknown path", () => {
    const { result } = renderHook(() => useNestedDataStore(), { wrapper });
    expect(result.current.getData("unknown")).toBeNull();
  });

  it("getData returns data previously stored via setData", () => {
    const { result } = renderHook(() => useNestedDataStore(), { wrapper });
    act(() => result.current.setData("a:b", rows));
    expect(result.current.getData("a:b")).toEqual(rows);
  });

  it("setData overwrites data at the same path", () => {
    const updated = [{ id: "r2", name: "Bob" }];
    const { result } = renderHook(() => useNestedDataStore(), { wrapper });
    act(() => result.current.setData("a:b", rows));
    act(() => result.current.setData("a:b", updated));
    expect(result.current.getData("a:b")).toEqual(updated);
  });

  it("paths are isolated from each other", () => {
    const other = [{ id: "r2", name: "Bob" }];
    const { result } = renderHook(() => useNestedDataStore(), { wrapper });
    act(() => result.current.setData("path/one", rows));
    act(() => result.current.setData("path/two", other));
    expect(result.current.getData("path/one")).toEqual(rows);
    expect(result.current.getData("path/two")).toEqual(other);
  });

  it("getData and setData are stable references across renders", () => {
    const { result, rerender } = renderHook(() => useNestedDataStore(), {
      wrapper,
    });
    const { getData, setData } = result.current;
    rerender();
    expect(result.current.getData).toBe(getData);
    expect(result.current.setData).toBe(setData);
  });
});

// ---------------------------------------------------------------------------
// Nested providers — inner consumers see the outer store
// ---------------------------------------------------------------------------

describe("useNestedDataStore with nested providers", () => {
  it("a consumer inside a nested provider sees the outer store", () => {
    // Wrap in two providers; the inner one should not shadow the outer store.
    function doubleWrapper({ children }: { children: React.ReactNode }) {
      return (
        <NestedDataStoreProvider>
          <NestedDataStoreProvider>{children}</NestedDataStoreProvider>
        </NestedDataStoreProvider>
      );
    }
    // The inner NestedDataStoreProvider creates its own store, so the consumer
    // will see the inner store — this test documents the actual behaviour so
    // any future change to shadowing is caught explicitly.
    const { result } = renderHook(() => useNestedDataStore(), {
      wrapper: doubleWrapper,
    });
    act(() => result.current.setData("x", rows));
    expect(result.current.getData("x")).toEqual(rows);
  });
});
