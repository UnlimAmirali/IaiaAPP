import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import axios from 'axios';
import { createMMKV } from 'react-native-mmkv';
import { useApp } from '../context/AppContext';
import Config from 'react-native-config';

// ایجاد instance از MMKV
const storage = new createMMKV();

const Checklogin = ({ handleStep, handlesetCountdown, lang }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const apiUrl = Config.API_URL;
  const {
    isDarkMode,
    toggleTheme,
    language,
    translations,
    toggleLanguage,
  } = useApp();

  // تابع کمکی برای تبدیل اعداد فارسی به انگلیسی
  const convertPersianToEnglish = (text) => {
    const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    
    return text.split('').map(char => {
      const index = persianNumbers.indexOf(char);
      return index !== -1 ? englishNumbers[index] : char;
    }).join('');
  };

  const handleSendPhoneNumber = async () => {
    if (!phoneNumber.trim()) {
      setError(translations.login_phone_required || 'شماره موبایل الزامی است');
      return;
    }

    if (phoneNumber.length !== 11) {
      setError(translations.login_phone_invalid || 'شماره موبایل باید ۱۱ رقم باشد');
      return;
    }

    setLoading(true);
    setError('');
    console.log("in sibmit")
    try {
      let pn = convertPersianToEnglish(phoneNumber);
      
      // حذف هر چیزی غیر از عدد
      pn = pn.replace(/\D/g, '');

      const response_checklogin = await axios.post(
        `${apiUrl}/login/checklogin/`,
        {
          mobile: pn,
          lang: lang,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Referer: 'https://test.irani-ai.com/',
          },
          // تنظیم Host معمولاً از طریق baseURL بهتر است
          baseURL: 'https://api2.irani-ai.com',
        }
      );
      console.log(response_checklogin.data)
      // return;
      if (response_checklogin.data.data.isReg == true) {
        
        
        storage.set('uid', String(response_checklogin.data.data.uid));
        storage.set('mobile', String(pn));
        console.log(pn, String(response_checklogin.data.data.uid))
        handleStep(5);
      } else {
        handleStep(2);
        handlesetCountdown(120);
        storage.set('mobile', pn);
      }
    } catch (err) {
      Alert.alert("ts","ts")
      // return;
      console.log(err.response)
      const errorMessage = 
        err.response?.data?.message || 
        err.message || 
        translations.login_error || 
        'خطا در ارسال کد تایید';
      
      setError(errorMessage);
      
      // نمایش Alert برای خطاهای مهم
      Alert.alert(
        translations.error || 'خطا',
        errorMessage,
        [{ text: translations.ok || 'باشه' }]
      );
    } finally {
      setLoading(false);
    }
  };

  // استایل‌های مشروط بر اساس حالت تاریک/روشن
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      // backgroundColor: isDarkMode ? '#1e2939' : '#f5f5f5',
      color:'#111',
      padding: 5,
    },
    header: {
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: 'center',
      color: isDarkMode ? '#FFFFFF' : '#1e2939',
      marginBottom: 5,
      marginTop: 5,
    },
    errorContainer: {
      backgroundColor: isDarkMode ? '#7f1d1d' : '#fee2e2',
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
    },
    errorText: {
      color: isDarkMode ? '#fecaca' : '#dc2626',
      textAlign: 'right',
      fontSize: 14,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFF',
      marginBottom: 8,
      textAlign: 'right',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#D9D9D9',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDarkMode ? '#4b5563' : '#d1d5db',
      marginBottom: 20,
    },
    inputIcon: {
      paddingHorizontal: 12,
    },
    input: {
      flex: 1,
      padding: Platform.OS === 'ios' ? 12 : 10,
      color: '#000000',
      fontSize: 16,
      textAlign: 'right',
    },
    submitButton: {
      backgroundColor: '#D9D9D9',
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
    },
    submitButtonDisabled: {
      backgroundColor: '#9ca3af',
    },
    buttonText: {
      color: '#000000',
      fontSize: 16,
      fontWeight: '600',
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    loadingText: {
      color: '#000000',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        {translations.login_top_text}
      </Text>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <Text style={styles.inputLabel}>
        {translations.login_phoneNumber}
      </Text>
      
      <View style={styles.inputContainer}>
        <View style={styles.inputIcon}>
          {/* می‌توانید از react-native-vector-icons یا تصاویر محلی استفاده کنید */}
          {/* <Text style={{ fontSize: 20 }}>📱</Text> */}
          {/* یا: */}
          {/* <Image source={require('./assets/profile-circle.png')} style={{ width: 24, height: 24 }} /> */}
        </View>
        <TextInput
          style={styles.input}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          placeholder="09123456789"
          placeholderTextColor="#6b7280"
          keyboardType="phone-pad"
          maxLength={11}
          autoComplete="tel"
          textContentType="telephoneNumber"
          editable={!loading}
        />
      </View>

      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSendPhoneNumber}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#000000" />
            <Text style={styles.loadingText}>
              {translations.login_btn_loading_text}
            </Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>
            {translations.login_btn1}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default Checklogin;