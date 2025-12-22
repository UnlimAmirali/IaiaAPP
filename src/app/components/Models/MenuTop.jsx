import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useApp } from '../../context/AppContext';
// import AsyncStorage from '@react-native-async-storage/async-storage';
import { createMMKV } from 'react-native-mmkv';
import axios from "axios";
import { IoMdArrowDropdown } from "react-icons/io"; // نیاز به نصب react-native-vector-icons دارد

// کامپوننت‌های فرضی (باید جداگانه پیاده‌سازی شوند)
import MenuItem from "./MenuItem";
import MenuMobile from "./MenuMobile";
import CoinCount from "./CoinCount";

export default function MenuTop({ modelType, ParentGetIsMenuOpen, ParentSetIsOpenSideMen, isDarkMode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { openMenu, toggleMenu } = useApp();
  const navigation = useNavigation();
  const storage = new createMMKV();
  const fetchDataProfile = async () => {
    return;
    try {
      // const token = await AsyncStorage.getItem("token") || "";
      const token  = storage.getString('token');
      const config = token ? { headers: { 'Authorization': token } } : {};
      
      const response = await axios.get(
        `${apiUrl}/dashboard/?lang=fa&style=dark`,
        config
      );

      if (response.data?.data.user_img != "") {
        // await AsyncStorage.setItem("profileChat", response.data?.data.user_info.user_img);
        // const token  = storage.set("profileChat", response.data?.data.user_info.user_img);
      }
    } catch (err) {
      // console.error("Error fetching data:", err);
    }
  };

  useEffect(() => {
    fetchDataProfile();
  }, []);

  useEffect(() => {
    if (ParentGetIsMenuOpen) {
      ParentGetIsMenuOpen(isMenuOpen);
    }
  }, [isMenuOpen]);

  // استایل داینامیک بر اساس حالت تاریک/روشن
  const styles = StyleSheet.create({
    container: {
      flexDirection: 'column',
      backgroundColor: isDarkMode ? '#000' : '#f3f0f0',
    },
    mainMenu: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 20,
      paddingHorizontal: 15,
      backgroundColor: modelType === 1 
        ? (isDarkMode ? '#000' : 'rgba(243, 240, 240, 0.9)')
        : 'transparent',
      position: isMenuOpen ? 'absolute' : 'relative',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 40,
      elevation: 40,
    },
    logoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    logo: {
      width: 64,
      height: 64,
      resizeMode: 'contain',
      marginLeft: 10,
    },
    mobileContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#000' : '#f3f0f0',
      paddingHorizontal: 15,
      paddingVertical: 10,
    },
    dropdownButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#054363',
      justifyContent: 'center',
      alignItems: 'center',
      margin: 5,
    },
    placeholder: {
      height: 150,
    },
    // استایل‌های grid simulation
    gridContainer: {
      flexDirection: 'row',
      width: '100%',
    },
    gridCol3: {
      width: '25%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    gridCol6: {
      width: '50%',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* نسخه دسکتاپ (در React Native معمولا مخفی می‌شود) */}
      <View style={{ display: Platform.OS === 'web' ? 'flex' : 'none' }}>
        <View style={styles.mainMenu}>
          <View style={styles.gridContainer}>
            {/* ستون اول */}
            <View style={styles.gridCol3}>
              <CoinCount isDarkMode={isDarkMode} />
            </View>
            
            {/* ستون دوم */}
            <View style={styles.gridCol6}>
              <MenuItem 
                onMenuToggle={setIsMenuOpen} 
                modelType={modelType} 
                isMenuOpenParent={isMenuOpen} 
              />
            </View>
            
            {/* ستون سوم */}
            <View style={styles.gridCol3}>
              <TouchableOpacity onPress={() => navigation.navigate('Home')}>
                <Image 
                  source={{ 
                    uri: isDarkMode 
                      ? "/logo.png" // باید آدرس کامل باشد
                      : "/logo-light.svg" 
                  }} 
                  style={styles.logo}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        {isMenuOpen && <View style={styles.placeholder} />}
      </View>

      {/* نسخه موبایل */}
      <View style={[styles.mobileContainer, { display: Platform.OS === 'web' ? 'none' : 'flex' }]}>
        <MenuMobile ParentSetIsOpenSideMen={ParentSetIsOpenSideMen} />
        
        <View>
          <TouchableOpacity 
            onPress={() => toggleMenu('main')} 
            style={styles.dropdownButton}
          >
            {/* برای آیکون نیاز به نصب کتابخانه دارید */}
            {/* <IoMdArrowDropdown size={24} color="white" /> */}
            <Text style={{ color: 'white', fontSize: 24 }}>▼</Text>
          </TouchableOpacity>
        </View>
        
        <View style={{ display: 'none' }}>
          <TouchableOpacity onPress={() => navigation.navigate('Home')}>
            <Image 
              source={{ uri: "/logo.png" }}
              style={styles.logo}
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}