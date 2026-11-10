import React from 'react';
import { Label } from '../../constants/globalstyle';
import { ACTIVE_CURRENCY } from '../../utils/currency';

export const formatDisplay = (amount, currency = ACTIVE_CURRENCY) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return `${currency.symbol}0`;

  const fixed =
    currency.decimals > 0
      ? num.toFixed(currency.decimals)
      : Math.round(num).toString();

  const [intPart, decPart] = fixed.split('.');
  const withSeparator = intPart.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    currency.separator,
  );

  const formatted =
    currency.decimals > 0 && decPart
      ? `${withSeparator}${currency.decimalSep}${decPart}`
      : withSeparator;

  return `${currency.symbol} ${formatted}`;
};

const CurrencyView = ({
  amount = 0,
  currency = ACTIVE_CURRENCY,
  type = 'body',
  weight = 'semiBold',
  color = 'textMain',
  positive,
  negative,
  style,
}) => {
  const resolvedColor = positive ? 'success' : negative ? 'error' : color;
  const prefix = positive ? '+' : negative ? '-' : '';
  const absAmount = negative ? Math.abs(amount) : amount;

  return (
    <Label type={type} weight={weight} color={resolvedColor} style={style}>
      {prefix}
      {formatDisplay(absAmount, currency)}
    </Label>
  );
};

export default CurrencyView;
