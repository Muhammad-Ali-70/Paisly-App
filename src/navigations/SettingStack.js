import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SettingsScreen from '../screens/tabs/SettingStack/SettingsScreen';
import DebtScreen from '../screens/tabs/SettingStack/DebtScreen';
import DebtDetailScreen from '../screens/tabs/SettingStack/DebtDetailScreen';
import AddEditDebtScreen from '../screens/tabs/SettingStack/AddEditDebtScreen';
import EditProfileScreen from '../screens/tabs/SettingStack/EditProfileScreen';
import InvestmentsScreen from '../screens/tabs/SettingStack/InvestmentsScreen';
import InvestmentSettingsScreen from '../screens/tabs/SettingStack/InvestmentSettingsScreen';
import TransferScreen from '../screens/tabs/SettingStack/TransferScreen';
import ManageAccountsScreen from '../screens/tabs/SettingStack/ManageAccountsScreen';

import RemindersScreen from '../screens/tabs/SettingStack/RemindersScreen';
import RecurringBillsScreen from '../screens/tabs/SettingStack/RecurringBillsScreen';
import AddEditBillScreen from '../screens/tabs/SettingStack/AddEditBillScreen';

const Stack =createNativeStackNavigator();

const SettingStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="SettingScreen"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="SettingScreen" component={SettingsScreen} />
      <Stack.Screen name="DebtScreen" component={DebtScreen} />
      <Stack.Screen name="DebtDetailScreen" component={DebtDetailScreen} />
      <Stack.Screen name="AddEditDebtScreen" component={AddEditDebtScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="InvestmentsScreen" component={InvestmentsScreen} />
      <Stack.Screen name="InvestmentSettingsScreen" component={InvestmentSettingsScreen} />
      <Stack.Screen name="TransferScreen" component={TransferScreen} />
      <Stack.Screen name="ManageAccounts" component={ManageAccountsScreen} />
      <Stack.Screen name="Reminders" component={RemindersScreen} />
      <Stack.Screen name="RecurringBills" component={RecurringBillsScreen} />
      <Stack.Screen name="AddEditBill" component={AddEditBillScreen} />
    </Stack.Navigator>
  );
};

export default SettingStack;
