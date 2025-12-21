import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import axios from 'axios';
// import { useRouter } from 'expo-router';
import { useApp } from '../context/AppContext';
import { createMMKV } from 'react-native-mmkv';
import Config from 'react-native-config';
// Initialize MMKV
const storage = new createMMKV();

const PasswordCheck = ({ handleStep, handlesetCountdown, lang }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [captchaURL, setCaptchaUrl] = useState(null);
  const [captchaID, setCaptchaID] = useState('');
  const [captchaRes, setCaptchaRes] = useState('');
  const [password, setPassword] = useState('');
  const apiUrl = Config.API_URL;
  const refererUrl = Config.Referer_URL;
  const hostUrl = Config.Host_URL;
  const {
    isDarkMode,
    toggleTheme,
    language,
    translations,
    toggleLanguage,
  } = useApp();
  
  // const router = useRouter();
  const mobile = storage.getString('mobile') || '';
  const uid = storage.getString('uid') || '';

  useEffect(() => {
    handleCaptcha();
  }, []);

  const handleCaptcha = async () => {
    setCaptchaRes('');
    try {
      const resp = await axios.get(
        `${apiUrl}/recapcha/?lang=fa`,
        {
          headers: {
            'Content-Type': 'application/json',
            Referer: refererUrl,
          },
          // تنظیم Host معمولاً از طریق baseURL بهتر است
          baseURL: hostUrl,
        }
      );
      setCaptchaUrl(resp.data.data.url);
      setCaptchaID(resp.data.data.cid);
      console.log(resp.data)
    } catch (err) {
      console.log(err.response)
      setError(err.response?.data?.message || err.message || 'خطا در ارسال مجدد کد');
    } finally {
      setLoading(false);
    }
  };
  const getUserProfile = async () => {
    let token = storage.getString("token")
     try {
      const resp = await axios.get(
        `${apiUrl}/dashboard/?lang=fa&style=dark`,
        {
          headers: {
            Authorization: `${token}`,
            'Content-Type': 'application/json',
            Referer: refererUrl,
          },
          // تنظیم Host معمولاً از طریق baseURL بهتر است
          baseURL: hostUrl,
        }
      );
      const jsonString = JSON.stringify(resp.data.data);
      storage.set("profile", jsonString)
      console.log(storage.getString("profile"))
      console.log(resp.data)
    } catch (err) {
      console.log(err.response)
      setError(err.response?.data?.message || err.message || 'خطا در ارسال مجدد کد');
    } finally {
      setLoading(false);
    }  
  }
  const handlePassword = async () => {
    setLoading(true);
    setError('');
    let uid2 = storage.getString('uid')
    console.log(
          uid2,
          password,
          captchaRes,
          captchaID,
         "fa", 
    )
    try {
      const response = await axios.post(
        `${apiUrl}/login/password/`,
        {
          uid: storage.getString('uid'),
          password: password,
          cres: captchaRes,
          cid: captchaID,
          lang: "fa",
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
      
      // Save token to MMKV
      storage.set('token', response.data.data.token);
      console.log("login data" , response.data.data)
      await getUserProfile()

      // Alert.alert("token",response.data.data.token)
      if (response.data.data.isNew === true) {
        handleStep(7);
      } else {
        // router.push('/home');
      }
    } catch (err) {
      handleCaptcha();
      setError(err.response?.data?.message || err.message || 'خطا در تأیید کد');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container]}>
      <Text style={[styles.title, { color: '#FFF' }]}>
        {translations.login_top_text_checkpass}
      </Text>

      {error ? (
        <View style={[styles.errorContainer, { backgroundColor: isDarkMode ? '#7f1d1d' : '#fee2e2' }]}>
          <Text style={[styles.errorText, { color: isDarkMode ? '#fecaca' : '#dc2626' }]}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.formContainer}>
        <Text style={[styles.mobileText, { color:  '#FFF' }]}>
          {translations.login_username} {mobile}
        </Text>

        {/* Password Input */}
        <View style={[styles.inputContainer, { borderColor: isDarkMode ? '#374151' : '#d1d5db' }]}>
          {/* <Image
            source={require('/login/lock.svg')}
            style={[styles.inputIcon, { width: 20, height: 20 }]}
            resizeMode="contain"
          /> */}
          <TextInput
            style={styles.input}
            placeholder={translations.login_password}
            placeholderTextColor="#6b7280"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            returnKeyType="done"
          />
        </View>

        {/* Captcha */}
        <TouchableOpacity 
          style={styles.captchaContainer}
          onPress={handleCaptcha}
          activeOpacity={0.7}
        >
          {captchaURL ? (
            <Image
              source={{ uri: captchaURL }}
              style={styles.captchaImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.captchaLoading}>
              <ActivityIndicator size="small" color="#000000" />
            </View>
          )}
          <TouchableOpacity 
            style={styles.captchaRefreshButton}
            onPress={handleCaptcha}
          >
            {/* <Image
              source={require('/login/refresh.svg')}
              style={{ width: 20, height: 20 }}
              resizeMode="contain"
            /> */}
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Captcha Input */}
        <View style={[styles.inputContainer, { borderColor: isDarkMode ? '#374151' : '#d1d5db' }]}>
          {/* <Image
            source={require('/login/lock.svg')}
            style={[styles.inputIcon, { width: 20, height: 20 }]}
            resizeMode="contain"
          /> */}
          <TextInput
            style={styles.input}
            placeholder={translations.login_captcha_placeholder}
            placeholderTextColor="#6b7280"
            value={captchaRes}
            onChangeText={setCaptchaRes}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handlePassword}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <>
              <ActivityIndicator
                style={styles.loadingIndicator}
                size="small"
                color="#000000"
              />
              <Text style={styles.submitButtonText}>
                {translations.login_btn_loading_text}
              </Text>
            </>
          ) : (
            <Text style={styles.submitButtonText}>
              {translations.login_btn2}
            </Text>
          )}
        </TouchableOpacity>

        {/* Forget Password */}
        <TouchableOpacity onPress={() => handleStep(6)}>
          <Text style={[styles.forgetPasswordText, { color: isDarkMode ? '#60a5fa' : '#2563eb' }]}>
            {translations.login_forgetpass_text}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    color:'#111',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    textAlign: 'right',
  },
  formContainer: {
    width: '100%',
  },
  mobileText: {
    fontSize: 14,
    textAlign: 'right',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D9D9D9',
    borderRadius: 8,
    marginTop: 20,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  inputIcon: {
    marginLeft: 8,
  },
  input: {
    flex: 1,
    height: 50,
    color: '#000000',
    textAlign: 'right',
  },
  captchaContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginTop: 20,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  captchaImage: {
    height: 40,
    flex: 1,
    borderRadius: 4,
  },
  captchaLoading: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captchaRefreshButton: {
    padding: 8,
  },
  submitButton: {
    backgroundColor: '#D9D9D9',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    flexDirection: 'row',
  },
  submitButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  forgetPasswordText: {
    textAlign: 'right',
    marginTop: 16,
    fontSize: 14,
  },
  loadingIndicator: {
    marginRight: 8,
  },
});

export default PasswordCheck;