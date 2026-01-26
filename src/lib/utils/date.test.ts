import { describe, it, expect, vi, afterEach } from "vitest";
import { formatTimeAgo } from "./date";

describe("formatTimeAgo", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return 'just now' for less than 60 seconds", () => {
    vi.useFakeTimers();
    const now = new Date("2024-01-15T12:00:00Z");
    vi.setSystemTime(now);

    const date30SecondsAgo = new Date("2024-01-15T11:59:30Z");
    expect(formatTimeAgo(date30SecondsAgo)).toBe("just now");

    const date1SecondAgo = new Date("2024-01-15T11:59:59Z");
    expect(formatTimeAgo(date1SecondAgo)).toBe("just now");
  });

  it("should return minutes for less than 60 minutes", () => {
    vi.useFakeTimers();
    const now = new Date("2024-01-15T12:00:00Z");
    vi.setSystemTime(now);

    const date1MinuteAgo = new Date("2024-01-15T11:59:00Z");
    expect(formatTimeAgo(date1MinuteAgo)).toBe("1m ago");

    const date30MinutesAgo = new Date("2024-01-15T11:30:00Z");
    expect(formatTimeAgo(date30MinutesAgo)).toBe("30m ago");

    const date59MinutesAgo = new Date("2024-01-15T11:01:00Z");
    expect(formatTimeAgo(date59MinutesAgo)).toBe("59m ago");
  });

  it("should return hours for less than 24 hours", () => {
    vi.useFakeTimers();
    const now = new Date("2024-01-15T12:00:00Z");
    vi.setSystemTime(now);

    const date1HourAgo = new Date("2024-01-15T11:00:00Z");
    expect(formatTimeAgo(date1HourAgo)).toBe("1h ago");

    const date12HoursAgo = new Date("2024-01-15T00:00:00Z");
    expect(formatTimeAgo(date12HoursAgo)).toBe("12h ago");

    const date23HoursAgo = new Date("2024-01-14T13:00:00Z");
    expect(formatTimeAgo(date23HoursAgo)).toBe("23h ago");
  });

  it("should return days for less than 7 days", () => {
    vi.useFakeTimers();
    const now = new Date("2024-01-15T12:00:00Z");
    vi.setSystemTime(now);

    const date1DayAgo = new Date("2024-01-14T12:00:00Z");
    expect(formatTimeAgo(date1DayAgo)).toBe("1d ago");

    const date3DaysAgo = new Date("2024-01-12T12:00:00Z");
    expect(formatTimeAgo(date3DaysAgo)).toBe("3d ago");

    const date6DaysAgo = new Date("2024-01-09T12:00:00Z");
    expect(formatTimeAgo(date6DaysAgo)).toBe("6d ago");
  });

  it("should return weeks for less than 4 weeks", () => {
    vi.useFakeTimers();
    const now = new Date("2024-01-29T12:00:00Z");
    vi.setSystemTime(now);

    const date1WeekAgo = new Date("2024-01-22T12:00:00Z");
    expect(formatTimeAgo(date1WeekAgo)).toBe("1w ago");

    const date2WeeksAgo = new Date("2024-01-15T12:00:00Z");
    expect(formatTimeAgo(date2WeeksAgo)).toBe("2w ago");

    const date3WeeksAgo = new Date("2024-01-08T12:00:00Z");
    expect(formatTimeAgo(date3WeeksAgo)).toBe("3w ago");
  });

  it("should return formatted date for 4 weeks or more", () => {
    vi.useFakeTimers();
    const now = new Date("2024-01-29T12:00:00Z");
    vi.setSystemTime(now);

    const date4WeeksAgo = new Date("2024-01-01T12:00:00Z");
    const result = formatTimeAgo(date4WeeksAgo);
    // The exact format depends on locale, but it should be a date string
    expect(result).not.toContain("ago");
    expect(result).toBeTruthy();
  });

  it("should return formatted date for very old dates", () => {
    vi.useFakeTimers();
    const now = new Date("2024-06-15T12:00:00Z");
    vi.setSystemTime(now);

    const date6MonthsAgo = new Date("2023-12-15T12:00:00Z");
    const result = formatTimeAgo(date6MonthsAgo);
    expect(result).not.toContain("ago");
    expect(result).toBeTruthy();
  });

  it("should handle exact boundaries correctly", () => {
    vi.useFakeTimers();
    const now = new Date("2024-01-15T12:00:00Z");
    vi.setSystemTime(now);

    // Exactly 60 seconds -> should be 1m ago
    const date60SecondsAgo = new Date("2024-01-15T11:59:00Z");
    expect(formatTimeAgo(date60SecondsAgo)).toBe("1m ago");

    // Exactly 60 minutes -> should be 1h ago
    const date60MinutesAgo = new Date("2024-01-15T11:00:00Z");
    expect(formatTimeAgo(date60MinutesAgo)).toBe("1h ago");

    // Exactly 24 hours -> should be 1d ago
    const date24HoursAgo = new Date("2024-01-14T12:00:00Z");
    expect(formatTimeAgo(date24HoursAgo)).toBe("1d ago");
  });
});
