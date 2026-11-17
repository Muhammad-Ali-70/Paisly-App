import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, ScrollText, Plus, PieChart, User } from 'lucide-react-native';
import { hp, wp } from '../constants/responsive';
import { borderRadius, Label } from '../constants/globalstyle';
import { useThemeColors } from '@hooks/useThemeColors';
import HomeScreen from '../screens/tabs/HomeScreen';
import HistoryScreen from '../screens/tabs/HistoryScreen';
import PlanStack from './PlanStack';
import SettingStack from './SettingStack';

const Tab = createBottomTabNavigator();

const TAB_ITEMS = [
  { name: 'Home', label: 'Home', Icon: Home, screen: HomeScreen },
  { name: 'History', label: 'History', Icon: ScrollText, screen: HistoryScreen },
  { name: 'Plan', label: 'Plan', Icon: PieChart, screen: PlanStack },
  { name: 'User', label: 'User', Icon: User, screen: SettingStack },
];

const CustomTabBar = ({ state, navigation }) => {
  const theme = useThemeColors();
  const left = TAB_ITEMS.slice(0, 2);
  const right = TAB_ITEMS.slice(2, 4);

  const renderTab = (item, index) => {
    const routeIndex = TAB_ITEMS.indexOf(item);
    const isFocused = state.index === routeIndex;
    const iconColor = isFocused ? theme.primary : theme.textMuted;
    const labelColor = isFocused ? 'primary' : 'textMuted';

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: state.routes[routeIndex].key,
        canPreventDefault: true,
      });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(item.name);
      }
    };

    return (
      <TouchableOpacity
        key={item.name}
        style={styles.tab}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <item.Icon size={wp(5.5)} color={iconColor} strokeWidth={1.8} />
        <Label
          type="bodyXs"
          weight="semiBold"
          color={labelColor}
          style={styles.tabLabel}
        >
          {item.label}
        </Label>
      </TouchableOpacity>
    );
  };

  const onAddPress = () => navigation.navigate('AddTransaction');

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.background }]}>
      <View style={[styles.bar, { backgroundColor: theme.surfacePrimary }]}>
        <View style={styles.side}>{left.map(renderTab)}</View>
        <View style={styles.fabSlot} />
        <View style={styles.side}>{right.map(renderTab)}</View>
      </View>

      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: theme.primary,
            borderColor: theme.surfacePrimary,
            shadowColor: theme.primary,
          },
        ]}
        activeOpacity={0.85}
        onPress={onAddPress}
      >
        <Plus size={wp(8)} color={theme.onPrimary} strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    paddingBottom: Platform.OS === 'ios' ? hp(3) : hp(1.5),
    paddingTop: hp(1),
    shadowColor: '#0b1c30',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 12,
    paddingHorizontal: wp(1.5),
  },
  side: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  fabSlot: {
    width: wp(20),
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(3),
    gap: hp(0.4),
    paddingTop: hp(0.2),
  },
  tabLabel: {
    letterSpacing: 0.6,
  },
  fab: {
    position: 'absolute',
    top: -wp(4),
    width: wp(15),
    height: wp(15),
    borderRadius: wp(8),
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 5,
  },
});

const TabNavigator = () => (
  <Tab.Navigator
    tabBar={props => <CustomTabBar {...props} />}
    screenOptions={{ headerShown: false }}
  >
    {TAB_ITEMS.map(item => (
      <Tab.Screen key={item.name} name={item.name} component={item.screen} />
    ))}
  </Tab.Navigator>
);

export default TabNavigator;
