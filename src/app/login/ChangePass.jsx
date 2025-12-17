import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
// import { useRouter } from 'expo-router'; // یا react-navigation بسته به پروژه شما
import axios from 'axios';
import { createMMKV} from 'react-native-mmkv';

// مقداردهی اولیه MMKV
const storage = new createMMKV();

const ChangePass = () => {
  const [password, setPassword] = useState('');
  const [RePassword, setRePassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleNewpass = async () => {
    // اعتبارسنجی
    if (password !== RePassword) {
      setError('رمز عبور و تکرار آن مطابقت ندارند');
      return;
    }

    if (password.length < 6) {
      setError('رمز عبور باید حداقل ۶ کاراکتر باشد');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = storage.getString('token');
      
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/login/newPass/`,
        {
          password: password,
          're-password': RePassword,
        },
        {
          headers: {
            Authorization: token,
          },
        }
      );

      // ذخیره پسورد جدید اگر نیاز باشد
      storage.set('passwordChanged', 'true');
      
      // هدایت به صفحه home
      // router.push('/home');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'خطا در تغییر کلمه عبور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ساخت کلمه عبور جدید</Text>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.formContainer}>
        <Text style={styles.userInfoText}>
          نام کاربری شما {storage.getString('mobile') || 'تعریف نشده'}
        </Text>

        {/* فیلد کلمه عبور جدید */}
        <View style={styles.inputContainer}>
          <View style={styles.iconContainer}>
            <Text>🔒</Text>
          </View>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="کلمه عبور جدید"
            placeholderTextColor="#666"
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        {/* فیلد تکرار کلمه عبور */}
        <View style={styles.inputContainer}>
          <View style={styles.iconContainer}>
            <Text>🔒</Text>
          </View>
          <TextInput
            style={styles.input}
            value={RePassword}
            onChangeText={setRePassword}
            placeholder="تکرار کلمه عبور جدید"
            placeholderTextColor="#666"
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        {/* دکمه تایید */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.disabledButton]}
          onPress={handleNewpass}
          disabled={loading}
          activeOpacity={0.8}>
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.submitButtonText}>تایید و ورود</Text>
          )}
        </TouchableOpacity>

        {/* لینک فراموشی رمز عبور (اگر نیاز باشد) */}
        {/* <TouchableOpacity onPress={() => router.push('/forgot-password')}>
          <Text style={styles.forgotPasswordText}>
            آیا کلمه عبور خود را فراموش کرده‌اید؟
          </Text>
        </TouchableOpacity> */}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
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
  userInfoText: {
    fontSize: 14,
    color: '#666',
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
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#D9D9D9',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '500',
  },
  forgotPasswordText: {
    textAlign: 'center',
    color: '#007AFF',
    fontSize: 14,
    marginTop: 15,
  },
});

export default ChangePass;