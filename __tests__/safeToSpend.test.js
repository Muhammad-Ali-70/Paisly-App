import { computeSafeToSpend, debtsCommitted } from '../src/utils/safeToSpend';

// 10 Nov 2026, payday on the 25th → 15 days to payday, 21 days left in Nov
const now = new Date(2026, 10, 10, 14, 0);

describe('computeSafeToSpend', () => {
  it('spreads cash over the days until payday', () => {
    const r = computeSafeToSpend({ balance: 15000, paydayDay: 25, now });
    expect(r.daysLeft).toBe(15);
    expect(r.allowance).toBe(1000);
    expect(r.limitedBy).toBe('cash');
  });

  it('sets aside udhar owed before payday, overdue included, but not after it', () => {
    const debts = [
      { remainingAmount: 3000, dueDate: new Date(2026, 10, 15).toISOString() },
      { remainingAmount: 1500, dueDate: new Date(2026, 10, 1).toISOString() }, // overdue
      { remainingAmount: 9000, dueDate: new Date(2026, 11, 20).toISOString() }, // after payday
    ];
    expect(debtsCommitted(debts, new Date(2026, 10, 25))).toBe(4500);
    const r = computeSafeToSpend({ balance: 15000, debts, paydayDay: 25, now });
    expect(r.debtsCommitted).toBe(4500);
    expect(r.allowance).toBe(700); // (15000 - 4500) / 15
  });

  it("spreads the budget over this month's days only when payday is next month", () => {
    // Payday on the 5th: 25 days away, but only 21 days of November budget left
    const r = computeSafeToSpend({
      balance: 1000000,
      budgetRemaining: 21000,
      paydayDay: 5,
      now,
    });
    expect(r.daysLeft).toBe(25);
    expect(r.limitedBy).toBe('budget');
    expect(r.allowance).toBe(1000); // 21000 / 21, not 21000 / 25
  });

  it('keeps the daily figure fixed while today is being spent', () => {
    const r = computeSafeToSpend({ balance: 14000, spentToday: 1000, paydayDay: 25, now });
    expect(r.allowance).toBe(1000);
    expect(r.leftToday).toBe(0);
  });

  it('reports a shortfall when commitments exceed the balance', () => {
    const debts = [{ remainingAmount: 20000, dueDate: new Date(2026, 10, 20).toISOString() }];
    const r = computeSafeToSpend({ balance: 15000, debts, paydayDay: 25, now });
    expect(r.allowance).toBe(0);
    expect(r.shortfall).toBe(5000);
  });
});
