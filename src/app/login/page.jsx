import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Platform,
  ImageBackground,
  Dimensions,
  KeyboardAvoidingView,
  Keyboard
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { createMMKV } from 'react-native-mmkv';

// Import your components (شما باید اینها را به React Native تبدیل کنید)
import CheckLogin from './CheckLogin';
import PasswordCheck from './CheckPassword';
import ValidationMobile from './ValidationMobile';
import Register from './Register';
// import ForgetPassword from './ForgetPassword';
import ChangePass from './ChangePass';
// import CheckPassForNewPass from './CheckPassForNewPass';
// import TopMenuMain from "../components/TopMenuMain";

// Initialize MMKV
const storage = new createMMKV();

export default function LoginScreen() {
  const [step, setStep] = useState(1);
  const [countdown, setCountdown] = useState(0);
  const [lang, setLang] = useState("fa");
  const navigation = useNavigation();

  const handleStepParent = (s) => {
    setStep(s);
  };

  const handleSetCountdownParent = (s) => {
    setCountdown(s);
  };

  useEffect(() => {
    // Clear storage using MMKV
    try {
      storage.remove('token');
      storage.remove('uid');
      // storage.delete('support_chat_id');
      // storage.delete('support_conv_id');
      // storage.delete('ssupport_customer_name');
      console.log('Storage cleared successfully');
    } catch (error) {
      console.error("Error clearing storage:", error);
    }
  }, []);

  // Helper function to get MMKV value
  const getMMKVValue = (key, defaultValue = '') => {
    try {
      return storage.getString(key) || defaultValue;
    } catch (error) {
      console.error(`Error getting ${key} from MMKV:`, error);
      return defaultValue;
    }
  };

  // Helper function to set MMKV value
  const setMMKVValue = (key, value) => {
    try {
      storage.set(key, value);
    } catch (error) {
      console.error(`Error setting ${key} to MMKV:`, error);
    }
  };

  const renderStepComponent = () => {
    switch (step) {
      case 1:
        return (
          <CheckLogin
            handleStep={handleStepParent}
            handlesetCountdown={handleSetCountdownParent}
            lang={lang}
            storage={storage} // Pass MMKV instance to child components
          />
        );
      case 2:
        return (
          <ValidationMobile
            handleStep={handleStepParent}
            handlesetCountdown={handleSetCountdownParent}
            countdown={countdown}
            lang={lang}
            storage={storage}
          />
        );
      // case 3:
      //   return (
      //     <CheckPassForNewPass
      //       handleStep={handleStepParent}
      //       handlesetCountdown={handleSetCountdownParent}
      //       lang={lang}
      //       storage={storage}
      //     />
      //   );
      case 4:
        return (
          <Register
            handleStep={handleStepParent}
            handlesetCountdown={handleSetCountdownParent}
            lang={lang}
            storage={storage}
          />
        );
      case 5:
        return (
          <PasswordCheck
            handleStep={handleStepParent}
            handlesetCountdown={handleSetCountdownParent}
            lang={lang}
            storage={storage}
          />
        );
      // case 6:
      //   return (
      //     <ForgetPassword
      //       handleStep={handleStepParent}
      //       handlesetCountdown={handleSetCountdownParent}
      //       lang={lang}
      //       storage={storage}
      //     />
      //   );
      case 7:
        return (
          <ChangePass
            handleStep={handleStepParent}
            handlesetCountdown={handleSetCountdownParent}
            lang={lang}
            storage={storage}
          />
        );
      default:
        return null;
    }
  };
  const imageBg = require('../assets/login/bg.webp');
return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e2939" />
      <ImageBackground 
        source={imageBg} 
        resizeMode="cover"
        style={styles.background}
      >
        {/* <TopMenuMain lang={lang} setLang={setLang} /> */}
        
        <KeyboardAvoidingView 
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={false} // غیرفعال کردن اسکرول
          >
            <View style={styles.contentWrapper}>
              <View style={styles.cardContainer}>
                <View style={styles.iconContainer}>
                  <Image
                    source={require('../assets/user-octagon.webp')}
                    style={styles.icon}
                    resizeMode="contain"
                  />
                </View>

                <View style={styles.card}>
                  {renderStepComponent()}
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e2939',
    
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexWrap:1,
    marginTop:'20%',
    justifyContent: 'center',
    
    
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  cardContainer: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    minHeight: 400
  },
  iconContainer: {
    position: 'absolute',
    top: -50,
    zIndex: 10,
    width: 100,
    height: 100,
    backgroundColor: '#1e2939',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#0f172a',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  icon: {
    width: 60,
    height: 60,
    tintColor: '#1e2939',
  },
  card: {
    backgroundColor: '#1e2939',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingTop: 70,
    paddingBottom: 32,
    width: '100%',
    borderWidth: 1,
    borderColor: '#334155',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
});

// Export MMKV instance for use in other files
// export { storage };