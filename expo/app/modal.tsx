import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { PremiumCard } from '@/components/PremiumCard';

export default function ModalScreen() {
  const { colors, isDark } = useTheme();
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={true}
      onRequestClose={() => router.back()}
    >
      <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={() => router.back()}>
        <PremiumCard style={[styles.modalContent, { backgroundColor: colors.bgCard, borderColor: colors.border }]} padding={24} borderRadius={24}>
          <Text style={[styles.title, { color: colors.text }]}>Modal</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            This modal now follows the premium design system.
          </Text>

          <Pressable
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <View style={[styles.closeButtonInner, { backgroundColor: colors.accent }]}>
              <Text style={[styles.closeButtonText, { color: colors.white }]}>Close</Text>
            </View>
          </Pressable>
        </PremiumCard>
      </Pressable>

      <StatusBar style={Platform.OS === 'ios' ? (isDark ? 'light' : 'dark') : 'auto'} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderWidth: 1,
    margin: 20,
    alignItems: 'center',
    minWidth: 300,
    width: '90%',
    maxWidth: 420,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
  },
  description: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  closeButton: {
    minWidth: 100,
  },
  closeButtonInner: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  closeButtonText: {
    fontWeight: '700',
    textAlign: 'center',
  },
});
