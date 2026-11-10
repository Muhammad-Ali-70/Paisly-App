import React, { useState } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  ActivityIndicator,
  Share,
  Platform,
} from 'react-native';
import { X, Download, Mail } from 'lucide-react-native';
import { borderRadius, Label } from '../../../constants/globalstyle';
import { hp, wp } from '../../../constants/responsive';
import { useThemeColors } from '@hooks/useThemeColors';
import { exportCSVApi, exportEmailApi } from '../../../services/transactionService';
import { useToastService } from '../../../utils/ToastService';

// Well under the Binder limit once Android wraps it in an Intent (UTF-16)
const MAX_SHARE_CHARS = 200 * 1024;

const OPTIONS = [
  {
    id: 'csv',
    label: 'Download CSV',
    description: 'Export as CSV file',
    icon: Download,
    iconBg: '#EFF6FF',
    iconColor: '#3B82F6',
  },
  {
    id: 'email',
    label: 'Send to Email',
    description: 'Receive it in your inbox',
    icon: Mail,
    iconBg: '#ECFDF5',
    iconColor: '#10B981',
  },
];

const ExportModal = ({ visible, onClose }) => {
  const theme = useThemeColors();
  const styles = createStyles(theme);
  const toast = useToastService();
  const [loading, setLoading] = useState(null);

  const handleExport = async (format) => {
    setLoading(format);
    try {
      if (format === 'csv') {
        const csvData = await exportCSVApi();
        if (!csvData) {
          throw new Error('No data to export');
        }
        // The share sheet passes text through Android's ~1MB Binder buffer;
        // a long history overflows it (TransactionTooLargeException). Big
        // exports go to the user's email as a real .csv attachment instead.
        if (csvData.length > MAX_SHARE_CHARS) {
          await exportEmailApi();
          toast.success('Your history is large, so we emailed it to you as a CSV file');
          onClose();
          return;
        }
        const result = await Share.share({
          message: csvData,
          ...(Platform.OS === 'ios' ? { title: 'transactions.csv' } : {}),
        });
        // Only claim success when it was actually shared, not dismissed
        if (result?.action === Share.sharedAction) toast.success('CSV shared');
      } else if (format === 'email') {
        await exportEmailApi();
        toast.success('Export sent to your email');
      }
      onClose();
    } catch (e) {
      toast.error(e?.message || 'Export failed');
    } finally {
      setLoading(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Label type="bodyMedium" weight="bold" color="textMain">
                  Export Transactions
                </Label>
                <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.closeBtn}>
                  <X size={wp(4.5)} color={theme.textMuted} strokeWidth={2} />
                </TouchableOpacity>
              </View>

              {OPTIONS.map((opt, idx) => (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.option, idx < OPTIONS.length - 1 && styles.divider]}
                  onPress={() => handleExport(opt.id)}
                  activeOpacity={0.7}
                  disabled={loading !== null}
                >
                  <View style={[styles.iconBox, { backgroundColor: opt.iconBg }]}>
                    <opt.icon size={wp(4.5)} color={opt.iconColor} strokeWidth={1.8} />
                  </View>
                  <View style={styles.optionInfo}>
                    <Label type="bodySmall" weight="semiBold" color="textMain">
                      {opt.label}
                    </Label>
                    <Label type="bodyXs" weight="regular" color="textMuted">
                      {opt.description}
                    </Label>
                  </View>
                  {loading === opt.id ? (
                    <ActivityIndicator size="small" color={theme.primary} />
                  ) : opt.id === 'csv' ? (
                    <Download size={wp(4.5)} color={theme.textMuted} strokeWidth={1.8} />
                  ) : (
                    <Mail size={wp(4.5)} color={theme.textMuted} strokeWidth={1.8} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const createStyles = (t) =>
  StyleSheet.create({
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
    iconBox: {
      width: wp(10),
      height: wp(10),
      borderRadius: borderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: wp(5),
      paddingVertical: hp(2),
      gap: wp(3),
    },
    divider: {
      borderBottomWidth: 0.5,
      borderBottomColor: t.outlineVariant,
    },
    optionInfo: {
      flex: 1,
      gap: hp(0.2),
    },
  });

export default ExportModal;
