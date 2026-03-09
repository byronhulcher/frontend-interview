import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  generateData,
  companies,
  columns,
  randomElement,
  randomInt,
  randomFloat,
} from "./generateData";

describe("generateData utilities", () => {
  let mathRandomSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mathRandomSpy = vi.spyOn(Math, "random");
  });

  afterEach(() => {
    mathRandomSpy.mockRestore();
  });

  describe("randomElement", () => {
    it("returns element from array", () => {
      mathRandomSpy.mockReturnValue(0.5);
      const testArray = ["a", "b", "c", "d"];
      expect(testArray).toContain(randomElement(testArray));
    });

    it("handles boundary cases", () => {
      mathRandomSpy.mockReturnValue(0);
      expect(randomElement(["first", "second", "third"])).toBe("first");

      mathRandomSpy.mockReturnValue(0.99);
      expect(randomElement(["first", "second", "third"])).toBe("third");
    });
  });

  describe("randomInt", () => {
    it("returns integer within range", () => {
      mathRandomSpy.mockReturnValue(0.5);
      const result = randomInt(1, 10);
      expect(Number.isInteger(result)).toBe(true);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(10);
    });

    it("handles boundary values", () => {
      mathRandomSpy.mockReturnValue(0);
      expect(randomInt(5, 15)).toBe(5);

      mathRandomSpy.mockReturnValue(0.99);
      expect(randomInt(5, 15)).toBe(15);
    });
  });

  describe("randomFloat", () => {
    it("returns float within range", () => {
      mathRandomSpy.mockReturnValue(0.5);
      const result = randomFloat(1.0, 10.0);
      expect(result).toBeGreaterThanOrEqual(1.0);
      expect(result).toBeLessThanOrEqual(10.0);
    });

    it("handles boundary values", () => {
      mathRandomSpy.mockReturnValue(0);
      expect(randomFloat(2.5, 7.8)).toBe(2.5);

      mathRandomSpy.mockReturnValue(1);
      expect(randomFloat(2.5, 7.8)).toBe(7.8);
    });
  });

  describe("generateData", () => {
    it("generates correct number of records", () => {
      expect(generateData()).toHaveLength(100);
      expect(generateData(25)).toHaveLength(25);
      expect(generateData(0)).toEqual([]);
    });

    it("generates records with correct structure", () => {
      const result = generateData(3);
      result.forEach((record, index) => {
        expect(record).toMatchObject({
          id: index + 1,
          name: expect.any(String),
          company: expect.any(String),
          age: expect.any(Number),
          salary: expect.any(Number),
          active: expect.any(Boolean),
          score: expect.any(Number),
          description: expect.any(String),
        });
      });
    });

    it("generates values within expected ranges", () => {
      const result = generateData(5);
      result.forEach((record) => {
        expect(record.age).toBeGreaterThanOrEqual(22);
        expect(record.age).toBeLessThanOrEqual(65);
        expect(record.salary).toBeGreaterThanOrEqual(50000);
        expect(record.salary).toBeLessThanOrEqual(200000);
        expect(record.score).toBeGreaterThanOrEqual(0);
        expect(record.score).toBeLessThanOrEqual(100);
        expect(Number.isInteger(record.age)).toBe(true);
      });
    });

    it("generates valid string fields", () => {
      const result = generateData(3);
      result.forEach((record, index) => {
        expect(record.name.length).toBeGreaterThan(0);
        expect(record.company.length).toBeGreaterThan(0);
        expect(record.description).toMatch(
          /^.+\. ID: \d+\. This is a detailed description/,
        );
        expect(record.description).toContain(`ID: ${index + 1}.`);
      });
    });
  });

  describe("exported constants", () => {
    it("validates companies and columns exports", () => {
      expect(Array.isArray(companies)).toBe(true);
      expect(companies.length).toBeGreaterThan(0);
      expect(companies.every((company) => typeof company === "string")).toBe(
        true,
      );

      expect(Array.isArray(columns)).toBe(true);
      expect(columns.length).toBeGreaterThan(0);
      columns.forEach((column) => {
        expect(column).toHaveProperty("key");
        expect(column).toHaveProperty("header");
        expect(column).toHaveProperty("type");
        expect(["text", "number", "boolean", "popper"]).toContain(column.type);
      });
    });
  });
});
