import { advanceWidgetPage, renderFromCache } from './widgetSnapshot';

// Runs headless (no UI, no navigation, app stores not needed). The system asks
// for a fresh render when the widget is added, resized or on its periodic tick;
// each of those redraws from the cached snapshot. The "next" button just moves
// to the following cached page.
export const widgetTaskHandler = async ({
  widgetAction,
  clickAction,
  renderWidget,
}) => {
  switch (widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED':
      renderWidget(renderFromCache());
      break;
    case 'WIDGET_CLICK':
      if (clickAction === 'NEXT_PAGE') {
        advanceWidgetPage();
        renderWidget(renderFromCache());
      }
      break;
    default:
      break;
  }
};
