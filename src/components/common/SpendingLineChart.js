import React, { useState, useMemo } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { hp, wp } from '../../constants/responsive';
import { useThemeColors } from '@hooks/useThemeColors';

const fillDays = (dailySpending = [], daysInMonth) => {
  const map = {};
  dailySpending.forEach(d => {
    map[d.day] = d.total;
  });
  return Array.from({ length: daysInMonth }, (_, i) => ({
    value: map[i + 1] ?? 0,
    label: (i + 1) % 5 === 0 || i === daysInMonth - 1 ? String(i + 1) : '',
  }));
};

const SpendingLineChart = ({
  dailySpending = [],
  height = hp(13),
  color: _color,
  ...rest
}) => {
  const [width, setWidth] = useState(0);
  const { width: screenWidth } = useWindowDimensions();
  const theme = useThemeColors();
  const color = _color ?? theme.primary;

  const daysInMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0,
  ).getDate();

  const data = fillDays(dailySpending, daysInMonth);
  const maxVal = Math.max(...data.map(d => d.value), 1);

  const containerWidth = (width || screenWidth - wp(10) * 2) - wp(1);

  if (!width) {
    return (
      <View
        onLayout={e => setWidth(e.nativeEvent.layout.width)}
        style={{ width: '100%', height }}
      />
    );
  }

  return (
    <View style={{ paddingBottom: hp(1), overflow: 'hidden' }}>
      <LineChart
        data={data}
        width={containerWidth}
        height={height}
        curved
        curvature={0.2}
        color={color}
        thickness={3}
        areaChart
        startFillColor={theme.primary}
        endFillColor={theme.gradientPrimary}
        startOpacity={0.2}
        endOpacity={0.05}
        maxValue={maxVal * 1.3}
        noOfSections={3}
        yAxisTextStyle={{ fontSize: 10, color: theme.textMuted }}
        xAxisLabelTextStyle={{ fontSize: 9, color: theme.textMuted }}
        yAxisLabelText="PKR"
        yAxisLabelTextStyle={{ fontSize: 9, color: theme.textMuted }}
        yAxisThickness={0}
        xAxisThickness={0.5}
        xAxisColor={theme.outlineVariant}
        rulesColor={theme.outlineVariant}
        rulesType="dashed"
        dashWidth={3}
        dashGap={3}
        showVerticalLines={false}
        hideDataPoints
        initialSpacing={wp(5)}
        endSpacing={wp(5)}
        overflowTop={20}
        scrollToEnd={false}
        isAnimated={false}
        adjustToWidth
        {...rest}
      />
    </View>
  );
};

export default SpendingLineChart;
