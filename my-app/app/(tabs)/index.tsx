import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, ActivityIndicator, Alert, Dimensions } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Book, BookStatus } from '@/models/types';
import { mockApiService } from '@/services/mockApiService';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

const BOOKS_STORAGE_KEY = 'ebook_library';

export default function EbookLibraryScreen() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];

  // Get tab bar height to avoid obscuring content
  let tabBarHeight = 0;
  try {
    tabBarHeight = useBottomTabBarHeight();
  } catch (e) {
    // Fallback if not in a tab context
    tabBarHeight = 80;
  }

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
      updateBookStatus(book.id, 'uploading');
      const uploadUrl = await mockApiService.getUploadUrl(book.fileName, 'application/pdf');
      await mockApiService.uploadFile(uploadUrl, book.sourceUri, 'application/pdf');
      const gcsPath = `uploads/user-id-placeholder/${book.fileName}`;
      await mockApiService.startPdfProcessing(gcsPath);
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
        setBooks(prevBooks => [newBook, ...prevBooks]);
        handleUploadProcess(newBook);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not select PDF.');
    }
  };

  const handleRefresh = async (book: Book) => {
    try {
      const processedText = await mockApiService.getProcessedText(book);
      if (processedText) {
        updateBookStatus(book.id, 'ready', { processedText });
      } else {
        Alert.alert('Processing', 'Your book is still being analyzed by AI. Please wait a moment.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to check status.');
    }
  };

  const handleDelete = (bookId: string) => {
    Alert.alert(
      'Delete Book',
      'Are you sure you want to remove this book from your library?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: () => {
            setBooks(currentBooks => currentBooks.filter(b => b.id !== bookId));
          }
        },
      ]
    );
  };

  const handleOpenBook = (book: Book) => {
    if (book.status === 'ready') {
      router.push({ pathname: '/explore', params: { bookJson: JSON.stringify(book) } });
    } else if (book.status === 'failed') {
      Alert.alert('Error', `Upload failed: ${book.error}. Try deleting and re-uploading.`);
    } else {
      Alert.alert('Processing', 'This book is not yet ready for reading.');
    }
  };

  const getStatusIcon = (status: BookStatus) => {
    switch (status) {
      case 'ready': return <Ionicons name="checkmark-circle" size={20} color="#10b981" />;
      case 'uploading': return <ActivityIndicator size="small" color={themeColors.tint} />;
      case 'processing': return <ActivityIndicator size="small" color="#f59e0b" />;
      case 'failed': return <Ionicons name="alert-circle" size={20} color="#ef4444" />;
      default: return <Ionicons name="time-outline" size={20} color="#94a3b8" />;
    }
  };

  const renderItem = ({ item }: { item: Book }) => (
    <TouchableOpacity
      onPress={() => handleOpenBook(item)}
      style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
      activeOpacity={0.7}
    >
      <View style={styles.cardIconContainer}>
        <Ionicons name="document-text" size={32} color={themeColors.tint} />
      </View>
      <View style={styles.cardContent}>
        <ThemedText type="defaultSemiBold" numberOfLines={1} style={styles.fileName}>
          {item.fileName}
        </ThemedText>
        <View style={styles.statusRow}>
          {getStatusIcon(item.status)}
          <ThemedText style={styles.statusText}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </ThemedText>
        </View>
      </View>
      <View style={styles.cardActions}>
        {item.status === 'processing' && (
          <TouchableOpacity onPress={() => handleRefresh(item)} style={styles.iconButton}>
            <Ionicons name="refresh" size={22} color={themeColors.tint} />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.iconButton}>
          <Ionicons name="trash-outline" size={22} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={themeColors.tint} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <BlurView intensity={80} tint={colorScheme} style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>My Library</ThemedText>
        <ThemedText style={styles.headerSubtitle}>{books.length} Books</ThemedText>
      </BlurView>

      <FlatList
        data={books}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: tabBarHeight + 20 }]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="library-outline" size={80} color={themeColors.icon} style={{ opacity: 0.3 }} />
            <ThemedText style={styles.emptyText}>Your library is empty</ThemedText>
            <ThemedText style={styles.emptySubtext}>Add a PDF to start your AI-powered reading journey</ThemedText>
          </View>
        }
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: themeColors.tint, bottom: tabBarHeight + 20 }]}
        onPress={handleSelectPdf}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 4,
  },
  listContent: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    marginLeft: 6,
    opacity: 0.7,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    marginLeft: 4,
  },
  fab: {
    position: 'absolute',
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.5,
    marginTop: 8,
  },
});