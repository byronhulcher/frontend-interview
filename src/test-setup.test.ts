// Smoke test: verifies the test infrastructure is wired up correctly.
describe("test infrastructure", () => {
  it("runs a basic assertion", () => {
    expect(1 + 1).toBe(2);
  });

  it("has jest-dom matchers available", () => {
    const el = document.createElement("div");
    el.textContent = "hello";
    document.body.appendChild(el);
    expect(el).toBeInTheDocument();
    document.body.removeChild(el);
  });
});
