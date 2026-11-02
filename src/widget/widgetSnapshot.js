import React from 'react';
import { requestWidgetUpdate } from 'react-native-android-widget';
import { storage } from '../services/storage';
import { toDayString } from '../utils/recurring';
import SafeToSpendWidgetView from './SafeToSpendWidgetView';

// The widget renders from this cache alone, with no network or app state.

export const WIDGET_NAME = 'SafeToSpendWidget';
const SNAPSHOT_KEY = 'widget-snapshot';
const PAGE_KEY = 'widget-page';

export const readSnapshot = () => {
  try {
    const raw = storage.getString(SNAPSHOT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const readPage = () => storage.getNumber(PAGE_KEY) ?? 0;

export const renderFromCache = () => {
  const snapshot = readSnapshot();
  const pages = snapshot?.pages ?? [];
  // The set of pages can shrink (a bill gets paid); fall back to the first
  const index = readPage() < pages.length ? readPage() : 0;
  return (
    <SafeToSpendWidgetView
      snapshot={snapshot}
      index={index}
      today={toDayString(new Date())}
    />
  );
};

const repaint = () =>
  requestWidgetUpdate({
    widgetName: WIDGET_NAME,
    renderWidget: renderFromCache,
  }).catch(() => {});

/** Stores today's pages and repaints any widgets on the home screen. */
export const publishToWidget = pages => {
  const serialised = JSON.stringify({
    dayKey: toDayString(new Date()),
    pages,
  });
  // The app recomputes often; only repaint when something actually changed
  if (storage.getString(SNAPSHOT_KEY) === serialised) return;
  storage.set(SNAPSHOT_KEY, serialised);
  repaint();
};

/** The widget's "next" button: show the following page, wrapping round. */
export const advanceWidgetPage = () => {
  const count = readSnapshot()?.pages?.length ?? 0;
  if (count > 1) storage.set(PAGE_KEY, (readPage() + 1) % count);
};

/** Logout: the next person must not see this user's figures on the home screen. */
export const clearWidget = () => {
  storage.remove(SNAPSHOT_KEY);
  storage.remove(PAGE_KEY);
  repaint();
};
