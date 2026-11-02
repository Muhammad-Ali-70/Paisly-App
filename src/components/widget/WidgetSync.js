import { useEffect } from 'react';
import useSafeToSpend from '../../hooks/useSafeToSpend';
import { useRecurring } from '../../queries/recurring';
import { useDebtSummary } from '../../queries/debts';
import { useUnreadCount } from '../../queries/notifications';
import { buildWidgetPages } from '../../widget/widgetPages';
import { publishToWidget } from '../../widget/widgetSnapshot';

/**
 * Keeps the home-screen widget in step with the app. Mounted in the signed-in
 * tree (not on Home) so the widget also updates after a transaction is added
 * from elsewhere. Renders nothing.
 */
const WidgetSync = () => {
  const result = useSafeToSpend();
  const { data: bills } = useRecurring();
  const { data: debtSummary } = useDebtSummary();
  const { data: unread } = useUnreadCount();
  const upcomingDebts = debtSummary?.upcomingDebts;

  useEffect(() => {
    if (!result) return;
    publishToWidget(
      buildWidgetPages({ result, bills, debts: upcomingDebts, unread }),
    );
  }, [result, bills, upcomingDebts, unread]);

  return null;
};

export default WidgetSync;
