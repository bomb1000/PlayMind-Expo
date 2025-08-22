import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, Button, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
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

  // 初次載入：從本機儲存讀取
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

  // 每次 books 變動就存回本機
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
      // 1) 取得簽名上傳 URL
      updateBookStatus(book.id, 'uploading');
      const uploadUrl = await apiService.getUploadUrl(book.fileName, 'application/pdf');

      // 2) 上傳檔案
      await apiService.uploadFile(uploadUrl, book.sourceUri, 'application/pdf');

      // 3) 進入 processing，後端會自動觸發 parse/處理
      updateBookStatus(book.id, 'processing', {
        gcsUploadPath: `uploads/user-id-placeholder/${book.fileName}`,
      });
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
        // 立刻開始上傳流程
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
        {item.status === 'failed' && (
          <ThemedText style={{ color: 'red' }}>Error: {item.error}</ThemedText>
        )}
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
  switch (status) {
    case 'ready': return 'green';
    case 'uploading':
    case 'processing': return 'orange';
    case 'failed': return 'red';
    default: return 'gray';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16, // 保留 mvp 版本的列表頁面布局
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
