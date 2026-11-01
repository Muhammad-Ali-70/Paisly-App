import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  BackHandler,
} from 'react-native';
import { Carousel } from 'react-native-reanimated-carousel';
import { useThemeColors } from '@hooks/useThemeColors';
import { Label } from '../../constants/globalstyle';
import { hp, wp } from '../../constants/responsive';
import PrimaryButton from '../../components/ui/PrimaryButton';
import CarouselSlide from '../../components/onboarding/CarouselSlide';
import CarouselDotIndicator from '../../components/onboarding/CarouselDotIndicator';
import { CAROUSEL_SLIDES } from '../../constants/onboarding/carouselData';
import useAuthStore from '../../store/useAuthStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const WelcomeCarouselScreen = ({ navigation }) => {
  const theme = useThemeColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);

  const [currentIndex, setCurrentIndex] = useState(0);
  // Carousel needs an explicit height; use the space left between header and
  // footer so short screens don't push the CTA down or overlap it.
  const [carouselHeight, setCarouselHeight] = useState(0);
  const carouselRef = useRef(null);
  const setHasSeenCarousel = useAuthStore(s => s.setHasSeenCarousel);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        BackHandler.exitApp();
        return true;
      }
    );

    return () => backHandler.remove();
  }, []);

  const handleSkip = () => {
    setHasSeenCarousel(true);
  };

  const handleNext = () => {
    if (currentIndex < CAROUSEL_SLIDES.length - 1) {
      carouselRef.current?.next();
    }
  };

  const handleGetStarted = () => {
    setHasSeenCarousel(true);
  };

  const isLastSlide = currentIndex === CAROUSEL_SLIDES.length - 1;

  return (
    <View style={styles.safe}>
      <View style={styles.header}>
        <Label type="h4" weight="bold" color="primary">
          Paisly
        </Label>

        <TouchableOpacity
          onPress={handleSkip}
          activeOpacity={0.6}
          hitSlop={{ top: 10, bottom: 10, left: 16, right: 16 }}
        >
          <Label type="bodySmall" weight="semiBold" color="textMuted">
            SKIP
          </Label>
        </TouchableOpacity>
      </View>

      <View
        style={styles.carouselContainer}
        onLayout={e => setCarouselHeight(e.nativeEvent.layout.height)}
      >
        {carouselHeight > 0 && (
          <Carousel
            ref={carouselRef}
            data={CAROUSEL_SLIDES}
            renderItem={({ item, index }) => (
              <CarouselSlide slide={item} isActive={index === currentIndex} />
            )}
            width={wp(100)}
            height={carouselHeight}
            onSnapToItem={index => setCurrentIndex(index)}
            loop={false}
            enabled={true}
            panGestureHandlerProps={{
              activeOffsetX: [-10, 10],
            }}
            scrollAnimationDuration={400}
          />
        )}
      </View>

      <View style={styles.footer}>
        <CarouselDotIndicator
          total={CAROUSEL_SLIDES.length}
          currentIndex={currentIndex}
        />

        <View style={styles.buttonContainer}>
          <PrimaryButton
            variant="primary"
            size="lg"
            label={isLastSlide ? 'Get Started' : 'Next'}
            onPress={isLastSlide ? handleGetStarted : handleNext}
          />
        </View>
      </View>
    </View>
  );
};

const createStyles = (t, insets) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: t.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: wp(5),
      paddingTop: hp(1),
      paddingBottom: hp(1),
      backgroundColor: t.background,
    },
    carouselContainer: {
      flex: 1,
    },
    footer: {
      backgroundColor: t.background,
    },
    buttonContainer: {
      paddingHorizontal: wp(5),
      paddingBottom: hp(3),
    },
  });

export default WelcomeCarouselScreen;
