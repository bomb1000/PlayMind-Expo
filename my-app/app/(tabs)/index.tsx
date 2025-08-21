import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">PlayMind Expo</ThemedText>
      <ThemedText style={styles.subtitle}>
        Welcome to the PlayMind Expo! Start customizing your app by editing this file.
      </ThemedText>
      <ThemedText>
        Use the Explore tab to discover components and examples included with this template.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  subtitle: {
    marginTop: 12,
    marginBottom: 12,
  },
});
