import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, FlatList, Button, Text, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Book, BookStatus } from '@/models/types';
import { apiService } from '@/services/apiService';

const BOOKS_STORAGE_KEY = 'ebook_library';

export default function EbookLibraryScreen() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load books from storage on initial render
  useEffect(() => {
    const loadBooks = async () => {
      try {
        const storedBooks = await AsyncStorage.getItem(BOOKS_STORAGE_KEY);
        if (storedBooks) {
          setBooks(JSON.parse(storedBooks));
        }
      } catch (e) {
        console.error('Failed to load books.', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadBooks();
  }, []);

  // Save books to storage whenever they change
  useEffect(() => {
    const saveBooks = async () => {
      try {
        await AsyncStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(books));
      } catch (e) {
        console.error('Failed to save books.', e);
      }
    };
    if (!isLoading) {
      saveBooks();
    }
  }, [books, isLoading]);

  const updateBookStatus = (bookId: string, status: BookStatus, updates: Partial<Book> = {}) => {
    setBooks(currentBooks =>
      currentBooks.map(b => (b.id === bookId ? { ...b, status, ...updates } : b))
    );
  };

  const handleUploadProcess = async (book: Book) => {
    try {
      // Step 1: Get signed URL
      updateBookStatus(book.id, 'uploading');
      const uploadUrl = await apiService.getUploadUrl(book.fileName, 'application/pdf');

      // Step 2: Upload file
      await apiService.uploadFile(uploadUrl, book.sourceUri, 'application/pdf');

      // Step 3: Trigger the backend processing function
      // In a real app, the backend should return the exact path, but we'll construct it here for the MVP.
      const gcsPath = `uploads/user-id-placeholder/${book.fileName}`;
      await apiService.startPdfProcessing(gcsPath);

      // Step 4: Update status to 'processing'
      updateBookStatus(book.id, 'processing', { gcsUploadPath: gcsPath });
    } catch (error) {
      console.error('Upload process failed:', error);
      updateBookStatus(book.id, 'failed', { error: (error as Error).message });
    }
  };

  const handleSelectPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
      if (result.canceled === false && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const newBook: Book = {
          id: `${Date.now()}-${asset.name}`,
          fileName: asset.name,
          sourceUri: asset.uri,
          status: 'new',
        };
        setBooks(prevBooks => [...prevBooks, newBook]);
        // Start the upload process immediately
        handleUploadProcess(newBook);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not select PDF.');
      console.error(error);
    }
  };

  const handleRefresh = async (book: Book) => {
    try {
      const processedText = await apiService.getProcessedText(book);
      if (processedText) {
        updateBookStatus(book.id, 'ready', { processedText });
      } else {
        Alert.alert('Info', 'Book is still processing. Please try again in a moment.');
      }
    } catch (error) {
      console.error('Refresh failed:', error);
      Alert.alert('Error', 'Failed to check status.');
    }
  };

  const handleDelete = (bookId: string) => {
    setBooks(currentBooks => currentBooks.filter(b => b.id !== bookId));
  };

  const handleOpenBook = (book: Book) => {
    if (book.status === 'ready') {
      // Pass the book object as a search parameter. Expo Router will handle serialization.
      router.push({ pathname: '/explore', params: { bookJson: JSON.stringify(book) } });
    } else {
      Alert.alert('Book not ready', 'This book is not yet processed.');
    }
  };

  const renderItem = ({ item }: { item: Book }) => (
    <TouchableOpacity onPress={() => handleOpenBook(item)} style={styles.bookItem}>
      <View style={{ flex: 1 }}>
        <ThemedText type="defaultSemiBold">{item.fileName}</ThemedText>
        <ThemedText style={{ color: getStatusColor(item.status) }}>
          Status: {item.status}
        </ThemedText>
        {item.status === 'failed' && <ThemedText style={{color: 'red'}}>Error: {item.error}</ThemedText>}
      </View>
      {item.status === 'processing' && (
        <Button title="Refresh" onPress={() => handleRefresh(item)} />
      )}
      <Button title="Delete" color="red" onPress={() => handleDelete(item.id)} />
    </TouchableOpacity>
  );

  if (isLoading) {
    return <ActivityIndicator size="large" style={{ flex: 1 }} />;
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>My Ebook Library</ThemedText>
      <Button title="Select PDF to Add" onPress={handleSelectPdf} />
      <FlatList
        data={books}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        style={styles.list}
      />
    </ThemedView>
  );
}

const getStatusColor = (status: BookStatus) => {
  switch(status) {
    case 'ready': return 'green';
    case 'uploading':
    case 'processing': return 'orange';
    case 'failed': return 'red';
    default: return 'gray';
  }
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
  list: {
    marginTop: 16,
  },
  bookItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
