// components/History.jsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const History = ({ HistoryData, handleHistory, restForm, handleDeleteHistory }) => {
  const renderHistory = () => {
    if (!HistoryData || !Array.isArray(HistoryData)) return null;

    return HistoryData.map((item, index) => {
      // Handle different output types
      const outputType = item.output?.type;
      const output = item.output?.output;

      // Common delete handler
      const onDelete = () => {
        Alert.alert(
          'حذف تاریخچه',
          'آیا مطمئن هستید می‌خواهید این آیتم را حذف کنید؟',
          [
            { text: 'لغو', style: 'cancel' },
            { 
              text: 'حذف', 
              style: 'destructive',
              onPress: () => handleDeleteHistory(item.id)
            }
          ]
        );
      };

      // Common item container
      const renderItem = (content, type = 'default') => {
        return (
          <View key={`${item.id || index}`} style={styles.historyItem}>
            <TouchableOpacity 
              style={styles.historyContent}
              onPress={() => handleHistory(item)}
              activeOpacity={0.7}
            >
              {content}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={onDelete}
            >
              <MaterialIcons name="delete-outline" size={24} color="#ff4444" />
            </TouchableOpacity>
          </View>
        );
      };

      // Image type (single image or img_array)
      if (outputType === 'image' || outputType === 'img_array' || !outputType) {
        const imageUrl = Array.isArray(output) ? output[0] : output;
        
        if (!imageUrl) return null;
        
        return renderItem(
          <Image
            source={{ uri: imageUrl }}
            style={styles.historyImage}
            resizeMode="cover"
          />,
          'image'
        );
      }

      // 3D type
      else if (outputType === '3d') {
        return renderItem(
          <View style={styles.textContainer}>
            <Text style={styles.historyText} numberOfLines={2}>
              {item.id || 'خروجی سه بعدی'}
            </Text>
            <Text style={styles.historySubText}>خروجی سه بعدی</Text>
          </View>,
          '3d'
        );
      }

      // Text type
      else if (outputType === 'text') {
        return renderItem(
          <View style={styles.textContainer}>
            <Text style={styles.historyText} numberOfLines={3}>
              {output || 'بدون متن'}
            </Text>
          </View>,
          'text'
        );
      }

      // Int type (number)
      else if (outputType === 'int') {
        return renderItem(
          <View style={styles.intContainer}>
            {item.input?.img_url ? (
              <Image
                source={{ uri: item.input.img_url }}
                style={styles.intImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.intPlaceholder}>
                <Text style={styles.intValue}>{output || '0'}</Text>
                <Text style={styles.intLabel}>عدد</Text>
              </View>
            )}
          </View>,
          'int'
        );
      }

      // Default fallback
      else {
        return renderItem(
          <View style={styles.textContainer}>
            <Text style={styles.historyText} numberOfLines={2}>
              {item.id || `آیتم ${index + 1}`}
            </Text>
          </View>,
          'default'
        );
      }
    });
  };

  if (!HistoryData || HistoryData.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="time-outline" size={48} color="#999" />
        <Text style={styles.emptyText}>تاریخچه‌ای موجود نیست</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>تاریخچه</Text>
        {restForm && (
          <TouchableOpacity onPress={restForm} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>پاک کردن همه</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.historyList}>
        {renderHistory()}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ff4444',
    borderRadius: 6,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#999',
  },
  historyList: {
    padding: 8,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  historyContent: {
    flex: 1,
    marginRight: 12,
  },
  historyImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  textContainer: {
    padding: 8,
  },
  historyText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  historySubText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  intContainer: {
    width: '100%',
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  intImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  intPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  intValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  intLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  deleteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ff4444',
  },
});

export default History;