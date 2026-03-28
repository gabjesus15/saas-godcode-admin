import { describe, it, expect } from "vitest";
import {
	getMonthsPaidFromPayment,
	getSubscriptionEndsAt,
} from "../../lib/onboarding/billing-activation";

describe("getMonthsPaidFromPayment", () => {
	it("retorna months_paid cuando es valido", () => {
		expect(getMonthsPaidFromPayment({ months_paid: 3 })).toBe(3);
	});

	it("retorna fallback cuando months_paid es null", () => {
		expect(getMonthsPaidFromPayment({ months_paid: null })).toBe(1);
	});

	it("retorna fallback cuando months_paid es undefined", () => {
		expect(getMonthsPaidFromPayment({})).toBe(1);
	});

	it("retorna fallback cuando months_paid es 0", () => {
		expect(getMonthsPaidFromPayment({ months_paid: 0 })).toBe(1);
	});

	it("retorna fallback cuando months_paid es negativo", () => {
		expect(getMonthsPaidFromPayment({ months_paid: -2 })).toBe(1);
	});

	it("usa fallback personalizado", () => {
		expect(getMonthsPaidFromPayment({ months_paid: null }, 6)).toBe(6);
	});
});

describe("getSubscriptionEndsAt", () => {
	const baseDate = new Date("2025-01-01T00:00:00.000Z");

	it("retorna fecha 30 dias adelante para 1 mes", () => {
		const result = new Date(getSubscriptionEndsAt(1, baseDate));
		const expected = new Date("2025-01-31T00:00:00.000Z");
		expect(result.toISOString()).toBe(expected.toISOString());
	});

	it("retorna fecha 90 dias adelante para 3 meses", () => {
		const result = new Date(getSubscriptionEndsAt(3, baseDate));
		const expected = new Date("2025-04-01T00:00:00.000Z");
		expect(result.toISOString()).toBe(expected.toISOString());
	});

	it("retorna al menos 30 dias para valores invalidos", () => {
		const result = new Date(getSubscriptionEndsAt(0, baseDate));
		const expected = new Date("2025-01-31T00:00:00.000Z");
		expect(result.toISOString()).toBe(expected.toISOString());
	});

	it("retorna ISO string valido", () => {
		const result = getSubscriptionEndsAt(1, baseDate);
		expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
	});
});
