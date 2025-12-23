import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ImageBackground,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import Config from 'react-native-config';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';
import { createMMKV } from 'react-native-mmkv';

// کامپوننت‌های custom
import Menu from '../components/Models/MenuTop';
import ModelPrompt from './prompt/Main';
import ModelImage from './image/Main';
import ModelVideo from './video/Main';
import ModelVoice from './voice/Main';


import { useApp } from '../context/AppContext'; 

export default function ModelsScreen() {
  // const navigation = useNavigation();
  // const route = useRoute();
  const route = useRoute(); // استفاده از hook
  const { slug = "chat-ai" } = route.params || {};
  const apiUrl = Config.API_URL;
  // const slug = "prompt"
  console.log("slug", slug)
  // Alert.alert("",slug)

  const [modelFormData, setModelFormData] = useState([]);
  const [modelPageData, setModelPageData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modelType, setModelType] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpenMenu, setIsOpenMenu] = useState(false);
  const [isOpenSideMenu, setIsOpenSideMenu] = useState(false);
  const storage = new createMMKV();
  // استفاده از context یا store
  const { isDarkMode, language, translations } = useApp();

  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        setIsLoading(true);
        // Alert.alert("",slug)
        // return;
        const token  = storage.getString('token');
          //         const headers = {
          // ...(token ? { Authorization: token } : {}),
          // Referer: 'https://test.irani-ai.com/', // 
          // Host:"api2.irani-ai.com"
          // // 'X-App-Referrer': 'HomeScreen', // 

          // };
          // const config = { headers };
        const config = {
          params: {
            lang: language,
            history_limit: 25,
            style: isDarkMode ? "dark" : "light"
          },
          headers:{ 
            ...(token ? { Authorization: `${token}` } : {}),
          Referer: 'https://test.irani-ai.com/', // 
          Host:"api2.irani-ai.com"
         }
        };

        const response = await axios.get(
          `${apiUrl}/models/${slug}/`,
          config
        );

        if (response.data) {
          setModelPageData(response.data.data);
          setModelType(response.data.data.pageInfo.type_id);
          // Alert.alert("","model type in fetch", modelType)
          fetchForm();
        }

      } catch (error) {
        console.log("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchForm = async () => {
      try {
        // const token = await AsyncStorage.getItem('token');
        const token  = storage.getString('token');

        // Alert.alert("","in fetch",slug)
        // return;
          const headers = {
          ...(token ? { Authorization: token } : {}),
          Referer: 'https://test.irani-ai.com/', // 
          Host:"api2.irani-ai.com"
          // 'X-App-Referrer': 'HomeScreen', // 

          };
          const config = { headers };
        // const response = await axios.get(
        //   `${apiUrl}/?action=cat-menu&lang=${language}&style=${isDarkMode ? "dark" : "light"}`,
        //   config
        // );
        const response = await axios.get(
          `${apiUrl}/forms/?slug=${slug}&lang=${language}&history_limit=25&style=${isDarkMode?"dark":"light"}`,
          config
          // {
          //   headers: token ? { Authorization: `${token}` } : {}
          // }
        );
        setModelFormData(response.data.data);
        console.log("form data in slug", response.data);
      } catch (error) {

        console.log("Error fetching form data:", error.response);
      }
    };

    if (slug) {
      fetchMenuData();
    }
  }, [slug, isDarkMode, language]);

  useEffect(() => {
    if (modelType !== null) {
      // AsyncStorage.setItem("currentMenuType", modelType.toString());
      const token  = storage.set("currentMenuType", modelType.toString());
    }
  }, [modelType]);

  // هندل اسکرول در React Native
  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    if (offsetY > 100) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }
  };

  const handleSetIsOpenSidebar = () => {
    // Alert.alert(isOpenSideMenu)
    // Alert.alert("run func",String(isOpenSideMenu))
    setIsOpenSideMenu(!isOpenSideMenu);
  };

  const parentMsg = () => {
    // تابع callback از فرزند
  };

  const renderModel = () => {
    if (!modelType) return null;
    // Alert.alert(modelType)
    const commonProps = {
      ModelPageData: modelPageData,
      ModelFormData: modelFormData,
      onParanetMsg: parentMsg,
      ParentSideMenuState: isOpenSideMenu,
      ParenHandleSideBar: handleSetIsOpenSidebar
    };

    console.log("common props" , commonProps)

    switch (modelType.toString()) {
      case "1":
        return <ModelPrompt {...commonProps} />;
      case "2":
        return <ModelImage {...commonProps} />;
      case "3":
        return <ModelVideo {...commonProps} />;
      case "4":
        return <ModelVoice {...commonProps} />;
      default:
        return null;
    }
  };

  const ParentGetIsMenuOpen = (isOpen) => {
    setIsOpenMenu(isOpen);
    // Alert.alert(isOpen)
  };

  // استایل‌های مشترک
  const styles = {
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#000000' : '#f3f0f0',
    },
    backgroundImage: {
      position: 'absolute',
      width: '100%',
      height: 1500,
      top: 0,
      zIndex: 10,
    },
    headerContainer: {
      position: 'absolute',
      width: '100%',
      zIndex: 11,
      top: 0,
    },
    contentContainer: {
      flex: 1,
      paddingTop: Platform.OS === 'ios' ? 100 : 30,
      zIndex: 10,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={isDarkMode ? "#000" : "#000"} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#000' : '#000'}
      />
      
      {/* Background Image فقط برای type 4 */}
      {modelType == 4 && !isOpenMenu && (
        <ImageBackground
          source={
            isDarkMode
              ? require('../assets/models/voice_bg.png')
              : require('../assets/models/voice_bg_light.webp')
          }
          style={styles.backgroundImage}
          resizeMode="cover"
        />
      )}

      {/* Header Menu */}
      <View style={styles.headerContainer}>
        <Menu
          modelType={modelType}
          ParentGetIsMenuOpen={ParentGetIsMenuOpen}
          ParentSetIsOpenSideMen={handleSetIsOpenSidebar}
          isDarkMode={isDarkMode}
        />
      </View>

      {/* Main Content */}
      {/* <ScrollView
        style={styles.contentContainer}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={true}
      >
        {renderModel()}
      </ScrollView> */}

      <View style={styles.contentContainer}>
      {renderModel()}
      </View>

      {/* <view>
        {renderModel()}
      </view> */}
    </SafeAreaView>
  );
}