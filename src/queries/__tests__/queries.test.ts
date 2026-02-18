import { skipToken } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

import { batchQueries } from "../batchQueries";
import { translateQueries } from "../translateQueries";

vi.mock("@/api");

describe("batchQueries.detail", () => {
  it("batchId가 null이면 queryFn이 skipToken이다", () => {
    const options = batchQueries.detail(null);

    expect(options.queryFn).toBe(skipToken);
  });

  describe("refetchInterval", () => {
    const getRefetchInterval = (data: unknown) => {
      const options = batchQueries.detail("abc");
      const refetchInterval = options.refetchInterval as (query: {
        state: { data: unknown };
      }) => number | false;

      return refetchInterval({ state: { data } });
    };

    it('status가 "processing"이면 2000을 반환한다', () => {
      expect(getRefetchInterval({ status: "processing" })).toBe(2000);
    });

    it('status가 "completed"이면 false를 반환한다', () => {
      expect(getRefetchInterval({ status: "completed" })).toBe(false);
    });

    it("data가 없으면 false를 반환한다", () => {
      expect(getRefetchInterval(null)).toBe(false);
      expect(getRefetchInterval(undefined)).toBe(false);
    });
  });
});

describe("translateQueries.detail", () => {
  it("translateId가 null이면 queryFn이 skipToken이다", () => {
    const options = translateQueries.detail(null);

    expect(options.queryFn).toBe(skipToken);
  });

  describe("refetchInterval", () => {
    const getRefetchInterval = (data: unknown) => {
      const options = translateQueries.detail("xyz");
      const refetchInterval = options.refetchInterval as (query: {
        state: { data: unknown };
      }) => number | false;

      return refetchInterval({ state: { data } });
    };

    it('status가 "pending"이면 2000을 반환한다', () => {
      expect(getRefetchInterval({ status: "pending" })).toBe(2000);
    });

    it('status가 "processing"이면 2000을 반환한다', () => {
      expect(getRefetchInterval({ status: "processing" })).toBe(2000);
    });

    it('status가 "completed"이면 false를 반환한다', () => {
      expect(getRefetchInterval({ status: "completed" })).toBe(false);
    });

    it("data가 없으면 false를 반환한다", () => {
      expect(getRefetchInterval(null)).toBe(false);
      expect(getRefetchInterval(undefined)).toBe(false);
    });
  });
});
