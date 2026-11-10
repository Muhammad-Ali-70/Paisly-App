import { detectCategory } from './categoryDetector';

export const MAX_BULK_ENTRIES = 50;
const MAX_DESCRIPTION = 200;

// Matches "1,250.50", "250", "2.5k". `k` multiplies by 1000.
const NUMBER = /\d[\d,]*(?:\.\d+)?k?/gi;
// Pakistani mobile numbers ("03001234567", "0300-1234567", "+923001234567")
const PHONE = /(?:\+?92|0)3\d{2}[-\s]?\d{7}/g;
// Anything above this is almost certainly a typo or a pasted id, not spending
const MAX_AMOUNT = 100000000; // 10 crore
const CURRENCY_BEFORE = /(?:rs\.?|pkr|₨|\$)\s*$/i;
const CURRENCY_AFTER = /^\s*(?:rs\.?|pkr|\/-)/i;

const toAmount = token => {
  const isThousands = /k$/i.test(token);
  const value = parseFloat(token.replace(/,/g, '').replace(/k$/i, ''));
  return isThousands ? value * 1000 : value;
};

// All numbers in the line that are really amounts: "5kg", "10am" and "3rd"
// are skipped because a letter follows the digits.
const findAmounts = line => {
  const found = [];
  NUMBER.lastIndex = 0;
  let match = NUMBER.exec(line);
  while (match) {
    const start = match.index;
    const end = start + match[0].length;
    const nextChar = line[end];
    if (!(nextChar && /[a-z]/i.test(nextChar))) {
      found.push({ start, end, value: toAmount(match[0]) });
    }
    match = NUMBER.exec(line);
  }
  return found;
};

// The amount is the number at the end ("chai 50", "pizza 2 slices 500"), else
// the one at the start ("450 lunch"), else the last one in the line.
const pickAmount = (line, amounts) => {
  const last = amounts[amounts.length - 1];
  const first = amounts[0];
  const tail = line.slice(last.end).replace(CURRENCY_AFTER, '');
  if (!tail.replace(/[\s.,;:)/-]/g, '')) return last;
  const head = line.slice(0, first.start).replace(CURRENCY_BEFORE, '');
  if (!head.replace(/[\s(@:=-]/g, '')) return first;
  return last;
};

const tidy = text =>
  text
    .replace(/\s+/g, ' ')
    .replace(/^[\s\-–:=,.;@(/]+|[\s\-–:=,.;@)/]+$/g, '')
    .trim();

/**
 * Parses one line like "chai 50", "450 lunch", "rent 25k" or "+ salary 80,000".
 * A leading "+" marks income and a leading "-" marks expense; otherwise the
 * batch default applies. Returns `{ type, amount, description }` or `{ error }`.
 */
export const parseLine = (rawLine, defaultType = 'expense') => {
  let line = rawLine.trim();
  let type = defaultType;

  // Bullets and "1." / "1)" list numbering
  line = line.replace(/^[•·*]\s*/, '');
  if (/\d/.test(line.replace(/^\d{1,2}[.)]\s+/, ''))) {
    line = line.replace(/^\d{1,2}[.)]\s+/, '');
  }

  if (/^\+/.test(line)) {
    type = 'income';
    line = line.slice(1).trim();
  } else if (/^[-−–]/.test(line)) {
    type = 'expense';
    line = line.slice(1).trim();
  }

  // Phone numbers are blanked (same length, so positions still line up) before
  // looking for amounts, then kept in the description: "jazzcash 03001234567 500"
  const phones = line.match(PHONE) ?? [];
  const amounts = findAmounts(line.replace(PHONE, m => ' '.repeat(m.length)));
  if (amounts.length === 0) {
    return { error: phones.length ? 'Looks like a phone number, not an amount' : 'No amount found' };
  }

  const picked = pickAmount(line, amounts);
  if (!Number.isFinite(picked.value) || picked.value <= 0) {
    return { error: 'Amount must be more than 0' };
  }
  if (picked.value > MAX_AMOUNT) {
    return { error: 'Amount looks too large. Check this line' };
  }

  const before = line.slice(0, picked.start).replace(CURRENCY_BEFORE, '');
  const after = line.slice(picked.end).replace(CURRENCY_AFTER, '');
  const description = tidy(`${before} ${after}`).slice(0, MAX_DESCRIPTION);

  return { type, amount: picked.value, description };
};

/**
 * Parses pasted/typed text, one entry per non-empty line.
 * Each row gets a `key` that is stable while other lines are edited
 * (the line's text plus its occurrence number), so per-row overrides survive.
 */
export const parseBulkText = (text, defaultType = 'expense') => {
  const seen = {};
  const rows = [];
  (text || '').split(/\r?\n/).forEach((raw, index) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    seen[trimmed] = (seen[trimmed] ?? -1) + 1;
    const key = `${trimmed}#${seen[trimmed]}`;
    rows.push({ key, line: index + 1, raw: trimmed, ...parseLine(trimmed, defaultType) });
  });
  return rows;
};

// Auto-detected category for a parsed row. Falls back to "other". Expense
// "investment" is skipped: the full Add flow collects return settings for it,
// which bulk entry has no UI for.
export const guessCategory = (description, type) => {
  const id = detectCategory(description, type);
  if (!id || (type === 'expense' && id === 'investment')) return 'other';
  return id;
};

/**
 * Applies the user's per-row overrides (type / category) on top of the parsed
 * rows and fills in categories. Valid rows only get `category`.
 */
export const resolveRows = (rows, overrides = {}) =>
  rows.map(row => {
    if (row.error) return row;
    const o = overrides[row.key] ?? {};
    const type = o.type ?? row.type;
    return {
      ...row,
      type,
      category: o.category ?? guessCategory(row.description, type),
    };
  });

export const summariseRows = rows => {
  const valid = rows.filter(r => !r.error);
  const sum = type =>
    valid.filter(r => r.type === type).reduce((total, r) => total + r.amount, 0);
  return {
    count: valid.length,
    invalid: rows.length - valid.length,
    expenseTotal: sum('expense'),
    incomeTotal: sum('income'),
  };
};
