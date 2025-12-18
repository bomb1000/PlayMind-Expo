import React, { useState, useMemo } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, View, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Book } from '@/models/types';
import { mockApiService } from '@/services/mockApiService';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

const { width } = Dimensions.get('window');

export default function EbookReaderScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];

  // Get tab bar height for padding
  let tabBarHeight = 0;
  try {
    tabBarHeight = useBottomTabBarHeight();
  } catch (e) {
    tabBarHeight = 80;
  }

  const book: Book | null = useMemo(() => {
    if (typeof params.bookJson === 'string') {
      try {
        return JSON.parse(params.bookJson);
      } catch (e) {
        console.error('Failed to parse book JSON', e);
        return null;
      }
    }
    return null;
  }, [params.bookJson]);

  const handleGetSummary = async () => {
    if (!book?.processedText || isSummarizing || isExtracting) return;
    setIsSummarizing(true);
    try {
      const summary = await mockApiService.getSummary(book.processedText);
      Alert.alert('AI Summary', summary);
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleGetConcepts = async () => {
    if (!book?.processedText || isSummarizing || isExtracting) return;
    setIsExtracting(true);
    try {
      const concepts = await mockApiService.getConcepts(book.processedText);
      const formattedConcepts = concepts.map(c => `• ${c.concept}: ${c.explanation}`).join('\n\n');
      Alert.alert('Key Concepts', formattedConcepts);
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    } finally {
      setIsExtracting(false);
    }
  };

  if (!book) {
    return (
      <ThemedView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <ThemedText type="title" style={styles.errorTitle}>Book not found</ThemedText>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ThemedText style={{ color: '#fff' }}>Go Back</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <BlurView intensity={80} tint={colorScheme} style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
            <Ionicons name="chevron-back" size={28} color={themeColors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.headerCenter}>
          <ThemedText type="defaultSemiBold" numberOfLines={1} style={styles.headerTitle}>
            {book.fileName}
          </ThemedText>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={handleGetSummary}
            disabled={isSummarizing || isExtracting}
            style={styles.headerActionButton}
          >
            {isSummarizing ? (
              <ActivityIndicator size="small" color={themeColors.tint} />
            ) : (
              <Ionicons name="sparkles" size={24} color={themeColors.tint} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleGetConcepts}
            disabled={isSummarizing || isExtracting}
            style={styles.headerActionButton}
          >
            {isExtracting ? (
              <ActivityIndicator size="small" color="#a855f7" />
            ) : (
              <Ionicons name="bulb" size={24} color="#a855f7" />
            )}
          </TouchableOpacity>
        </View>
      </BlurView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText style={styles.content}>
          {book.processedText || 'No text has been processed for this book.'}
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 15,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerLeft: {
    width: 40,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    width: 80,
    justifyContent: 'flex-end',
  },
  headerIcon: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  headerActionButton: {
    padding: 8,
    marginLeft: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  content: {
    fontSize: 17,
    lineHeight: 28,
    letterSpacing: 0.3,
    opacity: 0.9,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
});
