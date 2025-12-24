// components/RTLPickerAdvanced.js
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { height } = Dimensions.get('window');

const RTLPickerAdvanced = ({
  selectedValue,
  onValueChange,
  options = [],
  placeholder = "انتخاب کنید...",
  style,
  itemStyle,
  disabled = false,
  error = false,
  label,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(height)).current;

  const selectedOption = options.find(opt => opt.value === selectedValue);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  const showModal = () => {
    setModalVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const hideModal = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setModalVisible(false));
  };

  const handleSelect = (value) => {
    onValueChange(value);
    hideModal();
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.itemContainer,
        item.value === selectedValue && styles.selectedItem,
      ]}
      onPress={() => handleSelect(item.value)}
      activeOpacity={0.7}
    >
      <View style={styles.itemContent}>
        <Text style={[styles.itemText, itemStyle]} numberOfLines={1}>
          {item.label}
        </Text>
        {item.value === selectedValue && (
          <Icon name="check-circle" size={20} color="#007AFF" />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <View style={styles.container}>
        {label && <Text style={styles.label}>{label}</Text>}
        
        <TouchableOpacity
          style={[
            styles.pickerContainer,
            style,
            error && styles.errorBorder,
            disabled && styles.disabledContainer,
          ]}
          onPress={() => !disabled && showModal()}
          disabled={disabled}
          activeOpacity={0.8}
        >
          <View style={styles.pickerContent}>
            <Text
              style={[
                styles.pickerText,
                !selectedValue && styles.placeholderText,
                { textAlign: 'right' },
                error && styles.errorText,
              ]}
              numberOfLines={1}
            >
              {displayText}
            </Text>
            <Icon
              name={modalVisible ? "keyboard-arrow-up" : "keyboard-arrow-down"}
              size={24}
              color={error ? "#FF3B30" : "#666"}
            />
          </View>
        </TouchableOpacity>
        
        {error && typeof error === 'string' && (
          <Text style={styles.errorMessage}>{error}</Text>
        )}
      </View>

      <Modal
        transparent={true}
        visible={modalVisible}
        onRequestClose={hideModal}
        statusBarTranslucent
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={hideModal}
        >
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{placeholder}</Text>
              <TouchableOpacity onPress={hideModal} style={styles.closeButton}>
                <Icon name="close" size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={options}
              renderItem={renderItem}
              keyExtractor={(item) => item.value.toString()}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={true}
              initialNumToRender={20}
            />
            
            {options.length === 0 && (
              <View style={styles.emptyContainer}>
                <Icon name="info-outline" size={40} color="#999" />
                <Text style={styles.emptyText}>گزینه‌ای برای نمایش وجود ندارد</Text>
              </View>
            )}
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
    textAlign: 'right',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: 'white',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  pickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pickerText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    writingDirection: 'rtl',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  placeholderText: {
    color: '#999',
  },
  disabledContainer: {
    backgroundColor: '#f5f5f5',
    opacity: 0.7,
  },
  errorBorder: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
  },
  errorMessage: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  closeButton: {
    padding: 8,
  },
  listContent: {
    paddingBottom: 20,
  },
  itemContainer: {
    paddingHorizontal: 20,
    backgroundColor: 'white',
  },
  itemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  itemText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    textAlign: 'right',
    writingDirection: 'rtl',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  selectedItem: {
    backgroundColor: '#F0F7FF',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default RTLPickerAdvanced;