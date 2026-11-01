import {
  parseLine,
  parseBulkText,
  resolveRows,
  summariseRows,
} from '../src/utils/bulkEntryParser';

describe('parseLine', () => {
  test.each([
    ['chai 50', 50, 'chai'],
    ['50 chai', 50, 'chai'],
    ['Lunch - 450', 450, 'Lunch'],
    ['lunch: 450', 450, 'lunch'],
    ['Uber 1,250.50', 1250.5, 'Uber'],
    ['rent 25k', 25000, 'rent'],
    ['25K rent', 25000, 'rent'],
    ['groceries 2.5k', 2500, 'groceries'],
    ['chai 50 rs', 50, 'chai'],
    ['Rs. 500 petrol', 500, 'petrol'],
    ['pkr 1200 internet bill', 1200, 'internet bill'],
    ['chai 50.', 50, 'chai'],
    ['  samosa   30  ', 30, 'samosa'],
    ['Pizza 2 slices 500', 500, 'Pizza 2 slices'],
    ['• chai 50', 50, 'chai'],
    ['1. chai 50', 50, 'chai'],
    ['2) rickshaw 120', 120, 'rickshaw'],
    ['500', 500, ''],
  ])('%s', (line, amount, description) => {
    expect(parseLine(line)).toEqual({ type: 'expense', amount, description });
  });

  test('weights, times and ordinals are not amounts', () => {
    expect(parseLine('5kg rice 400')).toMatchObject({ amount: 400, description: '5kg rice' });
    expect(parseLine('dinner at 8pm 1500')).toMatchObject({ amount: 1500 });
    expect(parseLine('3rd floor rent 20000')).toMatchObject({ amount: 20000 });
  });

  test('a plain leading number is an amount, not list numbering', () => {
    expect(parseLine('2 chai')).toMatchObject({ amount: 2, description: 'chai' });
  });

  test('sign prefixes override the default type', () => {
    expect(parseLine('+ salary 80,000')).toEqual({
      type: 'income',
      amount: 80000,
      description: 'salary',
    });
    expect(parseLine('+500 freelance')).toMatchObject({ type: 'income', amount: 500 });
    expect(parseLine('- chai 50', 'income')).toMatchObject({ type: 'expense' });
    expect(parseLine('chai 50', 'income')).toMatchObject({ type: 'income' });
  });

  test('rejects lines without a usable amount', () => {
    expect(parseLine('just words')).toEqual({ error: 'No amount found' });
    expect(parseLine('chai 0')).toEqual({ error: 'Amount must be more than 0' });
    expect(parseLine('5kg')).toEqual({ error: 'No amount found' });
  });

  test('caps very long descriptions', () => {
    const long = 'x'.repeat(300);
    expect(parseLine(`${long} 10`).description).toHaveLength(200);
  });
});

describe('parseBulkText', () => {
  const text = 'chai 50\n\n  rickshaw 120 \r\nbad line\nchai 50';

  test('skips blank lines, keeps real line numbers, flags bad rows', () => {
    const rows = parseBulkText(text);
    expect(rows.map(r => r.line)).toEqual([1, 3, 4, 5]);
    expect(rows[2].error).toBe('No amount found');
  });

  test('duplicate lines get distinct keys that survive edits elsewhere', () => {
    const rows = parseBulkText(text);
    expect(rows[0].key).not.toBe(rows[3].key);
    const edited = parseBulkText(`new 5\n${text}`);
    expect(edited.find(r => r.line === 6).key).toBe(rows[3].key);
  });
});

describe('resolveRows / summariseRows', () => {
  test('detects categories, falls back to other, applies overrides', () => {
    const rows = parseBulkText('kfc 900\nmystery 10\n+ salary 5000');
    const resolved = resolveRows(rows, { [rows[1].key]: { category: 'gift' } });
    expect(resolved.map(r => r.category)).toEqual(['food', 'gift', 'salary']);
  });

  test('never auto-assigns the expense investment category', () => {
    const [row] = resolveRows(parseBulkText('stocks investment 1000'));
    expect(row.category).not.toBe('investment');
  });

  test('a type override re-detects the category for that type', () => {
    const rows = parseBulkText('refund 300');
    const [row] = resolveRows(rows, { [rows[0].key]: { type: 'income' } });
    expect(row).toMatchObject({ type: 'income', category: 'refund' });
  });

  test('totals ignore invalid rows', () => {
    const rows = resolveRows(parseBulkText('chai 50\n+ salary 1000\nnope'));
    expect(summariseRows(rows)).toEqual({
      count: 2,
      invalid: 1,
      expenseTotal: 50,
      incomeTotal: 1000,
    });
  });
});
