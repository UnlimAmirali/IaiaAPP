import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigationState } from '@react-navigation/native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
import { createMMKV } from 'react-native-mmkv';
import { Alert } from 'react-native';

const AppContext = createContext();
const storage = new createMMKV();
export function AppProvider({ children }) {
  const [Toaststs, setToastSts] = useState("loading");
  const [Toastmsg, setToastMsg] = useState(null);

  // حالت تاریک/روشن
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [updatedProfile, setUpdatedProfile] = useState(0);
  
  // مدیریت زبان
  const [language, setLanguage] = useState('fa');
  const [translations, setTranslations] = useState({});

  // وضعیت task جدید
  const [taskStatus, setTaskStatus] = useState({
    sts: null,
    message: null,
    output: null,
    outputType: null,
    isLoading: false
  });

  // مدیریت پروفایل کاربر
  const [userProfile, setUserProfile] = useState({
    avatar: '',
    name: '',
    email: '',
  });

  // مدیریت منو
  const [menuState, setMenuState] = useState({
    isMenuOpen: false,
    menuType: null,
    menuData: null
  });

  // بارگذاری داده‌های اولیه از AsyncStorage
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [savedDarkMode, savedLanguage, savedProfile] = await Promise.all([
          // AsyncStorage.getItem('darkMode'),
         storage.getString('darkMode'),

          // AsyncStorage.getItem('language'),
          storage.getString('language'),
          // AsyncStorage.getItem('userProfile')
          storage.getString('userProfile')
        ]);
        
        // پردازش مقدار darkMode
        if (savedDarkMode !== null) {
          setIsDarkMode(savedDarkMode === 'true');
        }
        
        if (savedLanguage) {
          setLanguage(savedLanguage);
        }

        if (savedProfile) {
          setUserProfile(JSON.parse(savedProfile));
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };

    loadInitialData();
  }, []);

  // بارگذاری ترجمه‌ها
  useEffect(() => {
    const loadTranslations = async () => {
      try {
        let translationsData;
        
        // بارگذاری ترجمه‌ها از فایل محلی
        if (language === 'fa') {
          translationsData = require('../assets/locales/fa.json');
        } else if (language === 'en') {
          translationsData = require('../assets/locales/en.json');
        }
        
        if (translationsData) {
          setTranslations(translationsData);
        }
      } catch (error) {
        console.error('Error loading translations:', error);
        
        // ترجمه‌های پیش‌فرض
        const defaultTranslations = {
          fa: {
            loading: 'در حال بارگذاری...',
            error: 'خطا',
            success: 'موفق',
          },
          en: {
            loading: 'Loading...',
            error: 'Error',
            success: 'Success',
          }
        };
        
        setTranslations(defaultTranslations[language] || defaultTranslations.fa);
      }
    };

    loadTranslations();
  }, [language]);

  // تغییر حالت تاریک/روشن
  const toggleTheme = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    try {
      // await AsyncStorage.setItem('darkMode', newMode.toString());
      storage.set('darkMode', newMode.toString());
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  // تغییر زبان
  const toggleLanguage = async () => {
    const newLanguage = language === 'fa' ? 'en' : 'fa';
    setLanguage(newLanguage);
    try {
      // await AsyncStorage.setItem('language', newLanguage);
      storage.set('language', newLanguage)
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  // تغییر زبان مستقیم
  const changeLanguage = async (newLanguage) => {
    if (['fa', 'en'].includes(newLanguage)) {
      setLanguage(newLanguage);
      try {
        // await AsyncStorage.setItem('language', newLanguage);
        storage.set('language', newLanguage)
      } catch (error) {
        console.error('Error saving language preference:', error);
      }
    }
  };

  // به‌روزرسانی پروفایل کاربر
  const updateProfile = async (newProfileData) => {
    setUpdatedProfile(prev => prev + 1);
    setUserProfile(prev => {
      const updatedProfile = { ...prev, ...newProfileData };
      // ذخیره در AsyncStorage
      // AsyncStorage.setItem('userProfile', JSON.stringify(updatedProfile))
      //   .catch(error => console.error('Error saving profile:', error));
      storage.set('userProfile', JSON.stringify(updatedProfile))
      return updatedProfile;
    });
  };

  // تغییر عکس پروفایل
  const updateAvatar = (newAvatarUrl) => {
    updateProfile({ avatar: newAvatarUrl });
  };

  // مدیریت task status
  const updateTaskStatus = (newStatus) => {
    setTaskStatus(prev => ({
      ...prev,
      ...newStatus
    }));
  };

  // شروع task
  const startTask = () => {
    updateTaskStatus({
      isLoading: true,
      sts: null,
      message: null,
      output: null,
      outputType: null
    });
  };

  // پایان task با موفقیت
  const completeTask = (output, outputType = null, message = 'عملیات با موفقیت انجام شد') => {
    updateTaskStatus({
      isLoading: false,
      sts: 'success',
      message,
      output,
      outputType
    });
  };

  // پایان task با خطا
  const failTask = (message = 'خطا در انجام عملیات') => {
    updateTaskStatus({
      isLoading: false,
      sts: 'error',
      message,
      output: null,
      outputType: null
    });
  };

  // مدیریت منو
  const openMenu = (menuType = null, menuData = null) => {
    setMenuState({
      isMenuOpen: true,
      menuType,
      menuData
    });
  };

  const closeMenu = () => {
    setMenuState({
      isMenuOpen: false,
      menuType: null,
      menuData: null
    });
  };

  const toggleMenu = (menuType = null, menuData = null) => {
    setMenuState(prev => ({
      isMenuOpen: !prev.isMenuOpen,
      menuType: prev.isMenuOpen ? null : menuType,
      menuData: prev.isMenuOpen ? null : menuData
    }));
  };

  // نمایش Toast (Alert در React Native)
  const showToast = (message, type = 'info') => {
    Alert.alert(
      type === 'success' ? 'موفقیت' : 
      type === 'error' ? 'خطا' : 
      type === 'warning' ? 'هشدار' : 'اطلاعیه',
      message,
      [{ text: 'باشه', onPress: () => {} }]
    );
  };

  // پاک کردن cache
  const clearCache = async () => {
    try {
      // await AsyncStorage.clear();
      storage.clearStore();
      showToast('حافظه پاک شد', 'success');
    } catch (error) {
      console.error('Error clearing cache:', error);
      showToast('خطا در پاک کردن حافظه', 'error');
    }
  };

  // تابع translate
  const t = (key, params = {}) => {
    let translation = translations[key] || key;
    
    // جایگزینی پارامترها
    Object.keys(params).forEach(param => {
      translation = translation.replace(`{{${param}}}`, params[param]);
    });
    
    return translation;
  };

  return (
    <AppContext.Provider value={{
      // تم و ظاهر
      isDarkMode,
      toggleTheme,
      
      // زبان و ترجمه
      language,
      translations,
      toggleLanguage,
      changeLanguage,
      t,
      
      // پروفایل کاربر
      userProfile,
      updateProfile,
      updateAvatar,
      updatedProfile,
      
      // مدیریت tasks
      taskStatus,
      setTaskStatus: updateTaskStatus,
      startTask,
      completeTask,
      failTask,
      
      // مدیریت منو
      menuState,
      openMenu,
      closeMenu,
      toggleMenu,
      
      // توابع کمکی
      showToast,
      clearCache,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}