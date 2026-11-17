import { useEffect } from 'react';
import { useRecurring } from '../../queries/recurring';
import { useDashboard } from '../../queries/transactions';
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
  const { data: dashboard } = useDashboard();
  const { data: bills } = useRecurring();
  const { data: debtSummary } = useDebtSummary();
  const { data: unread } = useUnreadCount();
  const upcomingDebts = debtSummary?.upcomingDebts;

  useEffect(() => {
    // Wait for the dashboard so a cold start doesn't briefly publish pages
    // without the spending figure.
    if (!dashboard) return;
    publishToWidget(
      buildWidgetPages({ dashboard, bills, debts: upcomingDebts, unread }),
    );
  }, [dashboard, bills, upcomingDebts, unread]);

  return null;
};

export default WidgetSync;
