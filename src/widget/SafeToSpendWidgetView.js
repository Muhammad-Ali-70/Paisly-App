import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

// Imported by the headless widget task: keep this to the widget components and
// plain data. Nothing here may touch navigation, hooks or app stores.

const BRAND = '#006C49';
const SOFT = '#D1FAE5';
const ALERT = '#FDE68A';

const STATUS_PAGES = {
  setup: { label: 'Paisly', amount: 'Set up', caption: 'Open the app to start', tone: 'normal' },
  stale: { label: 'Paisly', amount: '—', caption: 'Open Paisly to refresh', tone: 'normal' },
};

const pickPage = (snapshot, index, today) => {
  if (!snapshot?.pages?.length) return STATUS_PAGES.setup;
  // Yesterday's figures would be wrong today; the app refreshes them when opened
  if (snapshot.dayKey !== today) return STATUS_PAGES.stale;
  return snapshot.pages[index] ?? snapshot.pages[0];
};

// Both buttons have a fixed size so the text column gets whatever is left and
// nothing is pushed off the widget's edge.
const SafeToSpendWidgetView = ({ snapshot, index, today }) => {
  const page = pickPage(snapshot, index, today);
  const total = snapshot?.dayKey === today ? snapshot.pages.length : 0;
  const captionColor = page.tone === 'alert' ? ALERT : SOFT;

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: BRAND,
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <FlexWidget
        clickAction={page.uri ? 'OPEN_URI' : 'OPEN_APP'}
        clickActionData={page.uri ? { uri: page.uri } : undefined}
        style={{ flex: 1, flexDirection: 'column', marginRight: 6 }}
      >
        <TextWidget
          text={page.label}
          maxLines={1}
          truncate="END"
          style={{ fontSize: 11, color: SOFT }}
        />
        <TextWidget
          text={page.amount}
          maxLines={1}
          truncate="END"
          style={{ fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' }}
        />
        <TextWidget
          text={page.caption}
          maxLines={1}
          truncate="END"
          style={{ fontSize: 10, color: captionColor }}
        />
      </FlexWidget>

      {total > 1 ? (
        <FlexWidget
          clickAction="NEXT_PAGE"
          accessibilityLabel="Next"
          style={{
            width: 34,
            height: 26,
            borderRadius: 13,
            backgroundColor: '#0B8A5F',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 6,
          }}
        >
          <TextWidget
            text={`${index + 1}/${total}`}
            allowFontScaling={false}
            style={{ fontSize: 11, fontWeight: 'bold', color: '#FFFFFF' }}
          />
        </FlexWidget>
      ) : null}

      <FlexWidget
        clickAction="OPEN_URI"
        clickActionData={{ uri: 'paisly://addExpense' }}
        accessibilityLabel="Add expense"
        style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <TextWidget
          text="+"
          allowFontScaling={false}
          style={{ fontSize: 22, fontWeight: 'bold', color: BRAND }}
        />
      </FlexWidget>
    </FlexWidget>
  );
};

export default SafeToSpendWidgetView;
