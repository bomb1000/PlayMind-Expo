import React, { useState, useMemo } from 'react';
import { StyleSheet, ScrollView, Button, Alert, ActivityIndicator, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Book } from '@/models/types';
import { apiService } from '@/services/apiService';

export default function EbookReaderScreen() {
  const params = useLocalSearchParams();
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // Parse the book object from the navigation parameters
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
    if (!book?.processedText) return;
    setIsLoadingAi(true);
    try {
      const summary = await apiService.getSummary(book.processedText);
      Alert.alert('Summary', summary);
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleGetConcepts = async () => {
    if (!book?.processedText) return;
    setIsLoadingAi(true);
    try {
      const concepts = await apiService.getConcepts(book.processedText);
      const formattedConcepts = concepts.map(c => `• ${c.concept}: ${c.explanation}`).join('\n\n');
      Alert.alert('Key Concepts', formattedConcepts);
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    } finally {
      setIsLoadingAi(false);
    }
  };

  if (!book) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title">Book not found</ThemedText>
        <ThemedText>There was an error loading the book. Please go back and try again.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ThemedText type="title" style={styles.title}>{book.fileName}</ThemedText>

      <View style={styles.actionsContainer}>
        <Button title="Get Summary" onPress={handleGetSummary} disabled={isLoadingAi} />
        <Button title="Extract Concepts" onPress={handleGetConcepts} disabled={isLoadingAi} />
      </View>

      {isLoadingAi && <ActivityIndicator size="large" style={styles.loader} />}

      <ThemedView style={styles.contentContainer}>
        <ThemedText>{book.processedText || 'No text has been processed for this book.'}</ThemedText>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  loader: {
    marginVertical: 20,
  },
  contentContainer: {
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
});
