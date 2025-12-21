import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Clipboard,
  Alert,
  AppState,
  BackHandler,
} from 'react-native';
import axios from 'axios';
import { createMMKV } from 'react-native-mmkv';
import Config from 'react-native-config';
// import SmsRetriever from 'react-native-sms-retriever';
// import DeviceInfo from 'react-native-device-info';

import { useSmsUserConsent } from '@eabdullazyanov/react-native-sms-user-consent';
// مقداردهی اولیه MMKV
const storage = new createMMKV();

const Validatemobile = ({ handleStep, handlesetCountdown, countdown, lang }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [appState, setAppState] = useState(AppState.currentState);
  const apiUrl = Config.API_URL;
  const refererUrl = Config.Referer_URL;
  const hostUrl = Config.Host_URL;
  // خواندن شماره موبایل از MMKV
  const mobile = storage.getString('mobile') || '';
  const retrievedCode = useSmsUserConsent(4);
 

  useEffect(() => {
    if (retrievedCode) {setVerificationCode(retrievedCode);console.log("otp", retrievedCode)}
  }, [retrievedCode]);



  // تابع برای ارسال خودکار فرم
  const handleAutoSubmit = async (code) => {
    setVerificationCode(code);
    
    // کمی تاخیر برای UI
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // ارسال فرم
    await handleVerifyCodeWithCode(code);
  };

  const handleVerifyCode = async () => {
    await handleVerifyCodeWithCode(verificationCode);
  };

  const handleVerifyCodeWithCode = async (code) => {
    if (!code || code.length < 4) {
      setError('لطفا کد تأیید را وارد کنید');
      return;
    }

    setLoading(true);
    setError('');
    console.log(
        {
          mobile,
          code,
        }
    )
    try {
      const response = await axios.post(
        `${apiUrl}/login/validatemobile/`,
        {
          mobile: mobile,
          code: code,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Referer: refererUrl,
          },
          // تنظیم Host معمولاً از طریق baseURL بهتر است
          baseURL: hostUrl,
        }        
      );
      console.log("response", response.data)
      // ذخیره vid در MMKV
      storage.set('vid', String(response.data.data.vid));
      
      // رفتن به مرحله بعد
      handleStep(4);
    } catch (err) {
      console.log(err.response)
      setError(err.response?.data?.message || err.message || 'خطا در تأیید کد');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;

    setLoading(true);
    setError('');

    try {
      await axios.post(
        `${apiUrl}/login/resendcode`,
        {
          mobile: mobile,
          lang: lang || 'fa',
        }
      );
      
      handlesetCountdown(120);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'خطا در ارسال مجدد کد');
    } finally {
      setLoading(false);
    }
  };

  // بررسی کلیپبورد برای کد OTP (در iOS)
  const checkClipboardForCode = async () => {
    if (Platform.OS === 'ios') {
      try {
        // در iOS به permission نیاز دارد
        const content = await Clipboard.getString();
        const otpMatch = content.match(/\b\d{4,6}\b/);
        if (otpMatch) {
          const otp = otpMatch[0];
          setVerificationCode(otp);
          Alert.alert(
            'کد تشخیص داده شد',
            `آیا مایلید کد ${otp} استفاده شود؟`,
            [
              { text: 'خیر', style: 'cancel' },
              { text: 'بله', onPress: () => handleAutoSubmit(otp) },
            ]
          );
        }
      } catch (error) {
        console.log('Clipboard Error:', error);
      }
    }
  };

  // فعال کردن بررسی کلیپبورد هنگام focus شدن فیلد
  const handleInputFocus = () => {
    checkClipboardForCode();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>تایید شماره موبایل</Text>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.formContainer}>
        <Text style={styles.messageText}>
          کد تأیید به شماره {mobile} ارسال شد
        </Text>

        {/* فیلد کد تأیید */}
        <View style={styles.inputContainer}>
          {/* <View style={styles.iconContainer}>
            <Text>🔒</Text>
          </View> */}
          <TextInput
            style={styles.input}
            value={verificationCode}
            onChangeText={setVerificationCode}
            onFocus={handleInputFocus}
            placeholder="کد تأیید "
            placeholderTextColor="#666"
            keyboardType="number-pad"
            maxLength={4}
            autoFocus
            autoCapitalize="none"
          />
        </View>

        {/* دکمه ارسال مجدد */}
        <TouchableOpacity
          style={[
            styles.resendButton,
            (countdown > 0 || loading) && styles.disabledButton,
          ]}
          onPress={handleResendCode}
          disabled={countdown > 0 || loading}>
          <Text
            style={[
              styles.resendButtonText,
              countdown > 0 && styles.resendButtonDisabled,
            ]}>
            {countdown > 0
              ? `ارسال مجدد (${countdown} ثانیه)`
              : 'ارسال مجدد کد'}
          </Text>
        </TouchableOpacity>

        {/* دکمه تأیید */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.disabledButton]}
          onPress={handleVerifyCode}
          disabled={loading}
          activeOpacity={0.8}>
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.submitButtonText}>تایید و ادامه</Text>
          )}
        </TouchableOpacity>

        {/* دکمه بررسی کلیپبورد (برای iOS) */}
        {Platform.OS === 'ios' && (
          <TouchableOpacity
            style={styles.clipboardButton}
            onPress={checkClipboardForCode}>
            <Text style={styles.clipboardButtonText}>
              بررسی کلیپبورد برای کد
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    // backgroundColor: '#fff',
    justifyContent: 'center',
    color:'#FFF'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#FFF',
    marginBottom: 30,
  },
  errorContainer: {
    backgroundColor: '#FEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FCC',
  },
  errorText: {
    color: '#C00',
    textAlign: 'right',
    fontSize: 14,
  },
  formContainer: {
    width: '100%',
  },
  messageText: {
    fontSize: 14,
    color: '#FFF',
    textAlign: 'right',
    marginBottom: 25,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D9D9D9',
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  iconContainer: {
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 10,
    color: '#000',
    textAlign: 'right',
    fontSize: 18,
    letterSpacing: 8, // برای فاصله بین اعداد کد
  },
  resendButton: {
    alignItems: 'flex-end',
    marginBottom: 20,
    paddingVertical: 10,
  },
  resendButtonText: {
    color: '#007AFF',
    fontSize: 14,
  },
  resendButtonDisabled: {
    color: '#999',
  },
  submitButton: {
    backgroundColor: '#D9D9D9',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '500',
  },
  clipboardButton: {
    alignItems: 'center',
    marginTop: 15,
    padding: 10,
  },
  clipboardButtonText: {
    color: '#666',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
});

export default Validatemobile;