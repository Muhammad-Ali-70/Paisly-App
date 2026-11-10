import { parseLine } from '../src/utils/bulkEntryParser';

describe('parseLine with phone numbers', () => {
  it('does not read a mobile number as the amount', () => {
    expect(parseLine('jazzcash 03001234567')).toEqual({
      error: 'Looks like a phone number, not an amount',
    });
  });

  it('finds the real amount next to a phone number', () => {
    expect(parseLine('jazzcash 03001234567 500')).toMatchObject({
      amount: 500,
      description: 'jazzcash 03001234567',
    });
    expect(parseLine('500 sent to 0300-1234567')).toMatchObject({ amount: 500 });
    expect(parseLine('easypaisa +923001234567 1,200')).toMatchObject({ amount: 1200 });
  });

  it('flags implausibly large amounts', () => {
    expect(parseLine('rent 999999999999').error).toMatch(/too large/);
  });
});
