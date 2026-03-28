import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { PremiumCard } from '@/components/PremiumCard';

export default function NotFoundScreen() {
  const { colors } = useTheme();
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <PremiumCard style={styles.card} padding={24} borderRadius={24}>
          <Text style={[styles.title, { color: colors.text }]}>This screen does not exist.</Text>

          <Link href="/" style={[styles.link, { backgroundColor: colors.accent }]}>
            <Text style={[styles.linkText, { color: colors.white }]}>Go to home screen</Text>
          </Link>
        </PremiumCard>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  link: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 14,
  },
  linkText: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
});
