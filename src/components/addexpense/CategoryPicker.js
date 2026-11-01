import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Plus } from 'lucide-react-native';
import { hp, wp } from '../../constants/responsive';
import { borderRadius, Label } from '../../constants/globalstyle';
import { useThemeColors } from '@hooks/useThemeColors';
import SelectableIcon from '../ui/SelectableIcon';
import { CATEGORIES } from '../../constants/theme/accountMeta';

const CategoryPicker = ({
  activeId,
  onSelect,
  onSeeAll,
  onCreateNew,
  categories = CATEGORIES,
}) => {
  const theme = useThemeColors();
  const scrollRef = useRef(null);
  const itemX = useRef({});

  // Bring the active category into view, e.g. after picking one from "See All"
  useEffect(() => {
    const x = itemX.current[activeId];
    if (x != null) {
      scrollRef.current?.scrollTo({ x: Math.max(0, x - wp(20)), animated: true });
    }
  }, [activeId]);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Label type="bodyMedium" weight="semiBold" color="textMain">
          Category
        </Label>
        <TouchableOpacity onPress={onSeeAll} activeOpacity={0.7}>
          <Label type="bodySmall" weight="semiBold" color="primary">
            See All
          </Label>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {categories.map(cat => (
          <View
            key={cat.id}
            onLayout={e => {
              itemX.current[cat.id] = e.nativeEvent.layout.x;
            }}
          >
            <SelectableIcon
              iconName={cat.iconName}
              iconBg={cat.iconBg}
              iconColor={cat.iconColor}
              label={cat.label}
              active={activeId === cat.id}
              onPress={() => onSelect(cat.id)}
              size="md"
            />
          </View>
        ))}

        {onCreateNew && (
          <TouchableOpacity
            onPress={onCreateNew}
            activeOpacity={0.7}
            style={styles.newTile}
          >
            <View style={[styles.newIcon, { borderColor: theme.primary }]}>
              <Plus size={wp(5.2)} color={theme.primary} strokeWidth={2} />
            </View>
            <Label type="bodyXs" weight="regular" color="primary">
              New
            </Label>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  section: { marginHorizontal: wp(5), gap: hp(1.2) },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  list: { gap: wp(1), paddingRight: wp(2) },
  newTile: {
    alignItems: 'center',
    gap: hp(0.8),
    paddingVertical: hp(1),
    width: wp(20),
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  newIcon: {
    width: wp(11),
    height: wp(11),
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
});

export default CategoryPicker;
