import React, { useMemo } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {
  X,
  Calendar,
  FileText,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react-native';
import { wp, hp } from '../../../constants/responsive';
import { Label, borderRadius } from '../../../constants/globalstyle';
import CurrencyView from '../../common/CurrencyView';
import PaymentIcon from '../../common/Paymenticon';
import {
  getCategoryMeta,
  ACCOUNT_TYPE_META,
} from '../../../constants/theme/accountMeta';
import { formatDateTime } from '../../../utils/transactionUtils';
import { useThemeColors } from '@hooks/useThemeColors';

const ACCOUNT_TYPE_LABEL = {
  wallet: 'Wallet',
  bank: 'Bank Account',
  digitalWallet: 'Digital Wallet',
};

const DetailRow = ({ icon: Icon, label, value, valueColor, t, s }) => (
  <View style={s.detailRow}>
    <View style={s.detailIconWrap}>
      <Icon size={wp(4)} color={t.textMuted} strokeWidth={1.8} />
    </View>
    <View style={s.detailText}>
      <Label type="bodyXs" weight="regular" color="textMuted">
        {label}
      </Label>
      <Label
        type="bodySmall"
        weight="semiBold"
        color={valueColor ?? 'textMain'}
      >
        {value}
      </Label>
    </View>
  </View>
);

const TransactionDetailModal = ({ visible, transaction, onClose }) => {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (!transaction) return null;

  const {
    type,
    amount,
    category,
    categoryLabel,
    description,
    note,
    date,
    accountLabel,
    accountType,
  } = transaction;

  const isExpense = type === 'expense';
  const categoryMeta = getCategoryMeta(category);
  const accountMeta =
    ACCOUNT_TYPE_META[accountType] ?? ACCOUNT_TYPE_META.wallet;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              {/* ── Header ── */}
              <View style={styles.cardHeader}>
                <Label type="bodyMedium" weight="bold" color="textMain">
                  Transaction Details
                </Label>
                <TouchableOpacity
                  onPress={onClose}
                  activeOpacity={0.7}
                  style={styles.closeBtn}
                >
                  <X size={wp(4.5)} color={theme.textMuted} strokeWidth={2} />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.body}
              >
                {/* ── Amount hero ── */}
                <View style={styles.amountBlock}>
                  <View
                    style={[
                      styles.typeChip,
                      { backgroundColor: isExpense ? '#FFF1F2' : '#ECFDF5' },
                    ]}
                  >
                    {isExpense ? (
                      <ArrowDownLeft
                        size={wp(3.5)}
                        color="#F43F5E"
                        strokeWidth={2}
                      />
                    ) : (
                      <ArrowUpRight
                        size={wp(3.5)}
                        color="#10B981"
                        strokeWidth={2}
                      />
                    )}
                    <Label
                      type="bodyXs"
                      weight="semiBold"
                      style={{ color: isExpense ? '#F43F5E' : '#10B981' }}
                    >
                      {isExpense ? 'Expense' : 'Income'}
                    </Label>
                  </View>

                  <CurrencyView
                    amount={amount}
                    type="headingMd"
                    weight="bold"
                    positive={!isExpense}
                    negative={isExpense}
                  />

                  {description ? (
                    <Label
                      type="body"
                      weight="semiBold"
                      color="textMain"
                      style={styles.descLabel}
                    >
                      {description}
                    </Label>
                  ) : null}
                </View>

                {/* ── Divider ── */}
                <View style={styles.divider} />

                {/* ── Detail rows ── */}
                <View style={styles.details}>
                  {/* Category */}
                  <View style={styles.detailRow}>
                    <View style={styles.detailIconWrap}>
                      <PaymentIcon
                        name={categoryMeta.iconName}
                        backgroundColor={categoryMeta.iconBg}
                        color={categoryMeta.iconColor}
                        containerSize={wp(8)}
                        size={wp(4)}
                      />
                    </View>
                    <View style={styles.detailText}>
                      <Label type="bodyXs" weight="regular" color="textMuted">
                        Category
                      </Label>
                      <Label
                        type="bodySmall"
                        weight="semiBold"
                        color="textMain"
                      >
                        {categoryLabel}
                      </Label>
                    </View>
                  </View>

                  {/* Payment source */}
                  <View style={styles.detailRow}>
                    <View style={styles.detailIconWrap}>
                      <PaymentIcon
                        name={accountMeta.iconName}
                        backgroundColor={accountMeta.iconBg}
                        color={accountMeta.iconColor}
                        containerSize={wp(8)}
                        size={wp(4)}
                      />
                    </View>
                    <View style={styles.detailText}>
                      <Label type="bodyXs" weight="regular" color="textMuted">
                        {ACCOUNT_TYPE_LABEL[accountType] ?? 'Account'}
                      </Label>
                      <Label
                        type="bodySmall"
                        weight="semiBold"
                        color="textMain"
                      >
                        {accountLabel}
                      </Label>
                    </View>
                  </View>

                  <DetailRow
                    icon={Calendar}
                    label="Date & Time"
                    value={formatDateTime(date)}
                    t={theme}
                    s={styles}
                  />

                  {note ? (
                    <DetailRow icon={FileText} label="Note" value={note} t={theme} s={styles} />
                  ) : null}
                </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const createStyles = t => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(5),
  },
  card: {
    width: '100%',
    backgroundColor: t.surfacePrimary,
    borderRadius: borderRadius.xl,
    paddingTop: hp(2.5),
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingBottom: hp(1.5),
    borderBottomWidth: 0.5,
    borderBottomColor: t.outlineVariant,
  },
  closeBtn: {
    width: wp(8),
    height: wp(8),
    borderRadius: wp(4),
    backgroundColor: t.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(3),
  },
  amountBlock: {
    alignItems: 'center',
    paddingVertical: hp(3),
    gap: hp(1),
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.5),
    borderRadius: 999,
  },
  descLabel: {
    textAlign: 'center',
  },
  divider: {
    height: 0.5,
    backgroundColor: t.outlineVariant,
    marginBottom: hp(2),
  },
  details: {
    gap: hp(1.5),
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    paddingVertical: hp(0.5),
  },
  detailIconWrap: {
    width: wp(8),
    alignItems: 'center',
  },
  detailText: {
    flex: 1,
    gap: hp(0.2),
  },
});

export default TransactionDetailModal;
