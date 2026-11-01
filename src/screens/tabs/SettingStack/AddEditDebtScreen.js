import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { CheckCircle } from 'lucide-react-native';
import ScreenHeader from '../../../components/common/Screenheader';
import AppTextInput from '../../../components/ui/AppTextInput';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import ToggleButtons from '../../../components/ui/ToggleButtons';
import DebtDatePicker from '../../../components/ui/DebtDatePicker';
import AdditionalDebtFields from '../../../components/debt/AdditionalDebtFields';
import PaymentSourcePicker from '../../../components/addexpense/PaymentSourcePicker';
import PaymentSourceModal from '../../../components/modals/PaymentSourceModal';
import { useThemeColors } from '@hooks/useThemeColors';
import { hp, wp } from '../../../constants/responsive';
import {
  createDebtApi,
  getDebtByIdApi,
  updateDebtApi,
} from '../../../services/debtService';
import { useToastService } from '../../../utils/ToastService';
import { ThemedView } from '../../../components/ui/ThemedView';
import PrimaryLoader from '../../../components/ui/PrimaryLoader';

const AddEditDebtScreen = ({ navigation, route }) => {
  const { debtId } = route.params || {};
  const isEditing = !!debtId;

  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const toast = useToastService();

  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [counterpartyName, setCounterpartyName] = useState('');
  const [counterpartyEmail, setCounterpartyEmail] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [dueDate, setDueDate] = useState(new Date());
  const [debtType, setDebtType] = useState('outstanding');
  const [interestRate, setInterestRate] = useState('0');
  const [interestType, setInterestType] = useState('none');
  const [interestFrequency, setInterestFrequency] = useState('monthly');
  const [category, setCategory] = useState('Personal');
  const [reminderDaysBefore, setReminderDaysBefore] = useState('3');
  const [reminderFrequency, setReminderFrequency] = useState('once');
  const [reminderChannels, setReminderChannels] = useState(['email']);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingDebt, setLoadingDebt] = useState(isEditing);
  const [sourceAccountId, setSourceAccountId] = useState(null);
  const [sourceModalVisible, setSourceModalVisible] = useState(false);

  useEffect(() => {
    if (isEditing) {
      const fetchDebt = async () => {
        try {
          const data = await getDebtByIdApi(debtId);
          setDescription(data.description || '');
          setTotalAmount(data.totalAmount?.toString() || '');
          setCounterpartyName(data.counterpartyName || '');
          setCounterpartyEmail(data.counterpartyEmail || '');
          setStartDate(new Date(data.startDate));
          setDueDate(new Date(data.dueDate));
          setDebtType(data.debtType || 'outstanding');
          setInterestRate(data.interestRate?.toString() || '0');
          setInterestType(data.interestType || 'none');
          setInterestFrequency(data.interestFrequency || 'monthly');
          setCategory(
            data.category
              ? data.category.charAt(0).toUpperCase() + data.category.slice(1)
              : 'Personal',
          );
          setReminderDaysBefore(data.reminderDaysBefore?.toString() || '3');
          setReminderFrequency(data.reminderFrequency || 'once');
          setReminderChannels(data.reminderChannels || ['email']);
          setNotes(data.notes || '');
          setSourceAccountId(data.sourceAccountId?._id || null);
        } catch (err) {
          console.error('Failed to fetch debt for editing:', err);
          Alert.alert('Error', 'Failed to load debt for editing.');
          navigation.goBack();
        } finally {
          setLoadingDebt(false);
        }
      };
      fetchDebt();
    }
  }, [isEditing, debtId, navigation]);

  useEffect(() => {
    if (interestType === 'none') {
      setInterestRate('0');
    }
  }, [interestType]);

  const handleSave = useCallback(async () => {
    const parsedAmount = parseFloat(totalAmount);
    const parsedInterestRate = interestRate
      ? parseFloat(interestRate)
      : undefined;

    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid total amount.');
      return;
    }
    if (!counterpartyName.trim()) {
      Alert.alert(
        'Counterparty Required',
        'Please enter the counterparty name.',
      );
      return;
    }
    if (!sourceAccountId) {
      Alert.alert(
        'Source Account Required',
        'Please select the account where this debt money goes/comes from.',
      );
      return;
    }
    if (dueDate < startDate) {
      Alert.alert('Invalid Dates', 'Due date cannot be before the start date.');
      return;
    }

    setSaving(true);
    try {
      const debtData = {
        debtType,
        description: description.trim(),
        totalAmount: parsedAmount,
        counterpartyName: counterpartyName.trim(),
        counterpartyEmail: counterpartyEmail.trim(),
        startDate: startDate.toISOString(),
        dueDate: dueDate.toISOString(),
        interestRate: interestType === 'none' ? 0 : parsedInterestRate || 0,
        interestType,
        interestFrequency,
        category: category.trim().toLowerCase(),
        reminderDaysBefore: parseInt(reminderDaysBefore) || 3,
        reminderFrequency,
        reminderChannels,
        notes: notes.trim(),
        sourceAccountId,
      };

      if (isEditing) {
        await updateDebtApi(debtId, debtData);
        toast.success('Debt updated successfully!');
      } else {
        await createDebtApi(debtData);
        toast.success('Debt created successfully!');
      }
      navigation.goBack(); // Navigate back to DebtScreen
    } catch (e) {
      console.error('Save debt failed:', e);
      const message =
        e?.message ??
        `Could not ${isEditing ? 'update' : 'create'} debt. Please try again.`;
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }, [
    totalAmount,
    counterpartyName,
    counterpartyEmail,
    startDate,
    dueDate,
    debtType,
    description,
    interestRate,
    interestType,
    interestFrequency,
    category,
    reminderDaysBefore,
    reminderFrequency,
    reminderChannels,
    notes,
    isEditing,
    debtId,
    navigation,
    toast,
    sourceAccountId,
  ]);

  if (loadingDebt) {
    return (
      <ThemedView style={styles.safe}>
        <ScreenHeader
          title={isEditing ? 'Edit Debt' : 'Add Debt'}
          onBack={() => navigation.goBack()}
        />
        <View style={styles.loadingWrap}>
          <PrimaryLoader width={100} height={100} />
        </View>
      </ThemedView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.safe}
      behavior="padding"
      automaticOffset
    >
      <ScreenHeader
        title={isEditing ? 'Edit Debt' : 'Add Debt'}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.toggleWrap}>
        <ToggleButtons
          options={[
            { value: 'outstanding', label: 'Outstanding', color: theme.error },
            { value: 'receivable', label: 'Receivable', color: theme.primary },
          ]}
          activeValue={debtType}
          onSelect={setDebtType}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          <AppTextInput
            label="Description"
            placeholder="e.g., Car Loan, Student Fees"
            value={description}
            onChangeText={setDescription}
            returnKeyType="next"
          />
          <AppTextInput
            label="Total Amount"
            placeholder="0.00"
            value={totalAmount}
            onChangeText={setTotalAmount}
            keyboardType="numeric"
            leftIconName="card"
            returnKeyType="next"
          />
          <AppTextInput
            label="Counterparty Name"
            placeholder="e.g., Bank, Friend Name"
            value={counterpartyName}
            onChangeText={setCounterpartyName}
            leftIconName="user"
            returnKeyType="next"
          />
          <AppTextInput
            label="Counterparty Email (Optional)"
            placeholder="e.g., example@email.com"
            value={counterpartyEmail}
            onChangeText={setCounterpartyEmail}
            keyboardType="email-address"
            leftIconName="mail"
            returnKeyType="next"
          />
          <PaymentSourcePicker
            activeId={sourceAccountId}
            onSelect={setSourceAccountId}
            onSeeAll={() => setSourceModalVisible(true)}
          />
          <DebtDatePicker
            label="Start Date"
            date={startDate}
            onChange={setStartDate}
          />
          <DebtDatePicker
            label="Due Date"
            date={dueDate}
            onChange={setDueDate}
            minimumDate={startDate}
          />
          <AdditionalDebtFields
            interestType={interestType}
            onInterestTypeChange={setInterestType}
            interestRate={interestRate}
            onInterestRateChange={setInterestRate}
            interestFrequency={interestFrequency}
            onInterestFrequencyChange={setInterestFrequency}
            category={category}
            onCategoryChange={setCategory}
            reminderDaysBefore={reminderDaysBefore}
            onReminderDaysBeforeChange={setReminderDaysBefore}
            reminderFrequency={reminderFrequency}
            onReminderFrequencyChange={setReminderFrequency}
            reminderChannels={reminderChannels}
            onReminderChannelsChange={setReminderChannels}
            notes={notes}
            onNotesChange={setNotes}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          variant="primary"
          size="lg"
          label={saving ? 'Saving…' : isEditing ? 'Update Debt' : 'Add Debt'}
          icon={<CheckCircle size={wp(5)} color={theme.onPrimary} />}
          onPress={handleSave}
          disabled={saving}
        />
      </View>

      <PaymentSourceModal
        visible={sourceModalVisible}
        activeId={sourceAccountId}
        onSelect={setSourceAccountId}
        onClose={() => setSourceModalVisible(false)}
      />
    </KeyboardAvoidingView>
  );
};

const createStyles = t =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: t.background,
    },
    toggleWrap: {
      marginHorizontal: wp(5),
      marginTop: hp(2),
      marginBottom: hp(1),
    },
    scrollContent: {
      paddingBottom: hp(2),
    },
    form: {
      paddingTop: hp(1.5),
      paddingHorizontal: wp(5),
      gap: hp(0.5),
    },
    footer: {
      paddingHorizontal: wp(5),
      paddingVertical: hp(2),
      backgroundColor: t.background,
    },
    loadingWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

export default AddEditDebtScreen;
