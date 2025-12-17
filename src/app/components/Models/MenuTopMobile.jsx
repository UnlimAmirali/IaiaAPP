import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useApp } from "../../context/AppContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

export default function MenuTopMobile() {
  const [coin, setCoin] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const {
    isDarkMode,
    menuState,
    closeMenu,
    toggleMenu,
  } = useApp();

  const navigation = useNavigation();

  const fetchCoin = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem("token");
      
      if (!token) {
        setCoin(0);
        setIsLoading(false);
        return;
      }

      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/wallet/coins/?lang=fa&style=${isDarkMode ? "dark" : "light"}`,
        {
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data?.data) {
        setCoin(response.data.data.coins || 0);
      }
    } catch (error) {
      console.error("Error fetching coin data:", error);
      setCoin(0);
      
      // نمایش خطا در صورت نیاز
      if (error.response?.status === 401 || error.response?.status === 403) {
        Alert.alert(
          "خطای دسترسی",
          "لطفا مجدد وارد شوید",
          [{ text: "باشه", onPress: () => navigation.navigate("Login") }]
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoin();
  }, []);

  const handleMenuClose = () => {
    closeMenu();
  };

  const handleMenuItemPress = (screen, params = {}) => {
    closeMenu();
    
    // تاخیر کوچک برای بسته شدن منو قبل از ناوبری
    setTimeout(() => {
      if (screen === "home") {
        navigation.navigate("Home");
      } else {
        navigation.navigate(screen, params);
      }
    }, 300);
  };

  const checkAuthAndNavigate = async (screen) => {
    try {
      const token = await AsyncStorage.getItem("token");
      
      if (!token && screen !== "home") {
        Alert.alert(
          "ورود به سیستم",
          "برای دسترسی به این بخش لطفا وارد شوید",
          [
            { text: "انصراف", style: "cancel" },
            { text: "ورود", onPress: () => navigation.navigate("Login") },
          ]
        );
        closeMenu();
        return;
      }

      handleMenuItemPress(screen);
    } catch (error) {
      console.error("Error checking auth:", error);
    }
  };

  const menuItems = [
    {
      id: "home",
      title: "بازگشت",
      onPress: () => handleMenuItemPress("home"),
      color: "#FCE7F3", // صورتی روشن
    },
    {
      id: "buyCredit",
      title: (
        <>
          الماس:{" "}
          {isLoading ? (
            <ActivityIndicator size="small" color="#054363" />
          ) : (
            <Text style={{ fontWeight: "bold" }}>
              {coin === 0 ? "0" : coin.toLocaleString()}
            </Text>
          )}
        </>
      ),
      onPress: () => checkAuthAndNavigate("BuyCredit"),
      color: "#FCE7F3",
    },
    {
      id: "dashboard",
      title: "داشبورد",
      onPress: () => checkAuthAndNavigate("Dashboard"),
      color: "#FCE7F3",
    },
    {
      id: "support",
      title: "پشتیبانی",
      onPress: () => checkAuthAndNavigate("Tickets"),
      color: "#FCE7F3",
    },
  ];

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.9)",
    },
    container: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 50,
      paddingBottom: 30,
    },
    menuItem: {
      backgroundColor: "#FCE7F3", // صورتی روشن معادل bg-pink-100
      borderRadius: 25,
      marginVertical: 8,
      paddingVertical: 16,
      width: "66%", // معادل w-2/3
      alignSelf: "center",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
    },
    menuItemText: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#054363",
      textAlign: "center",
    },
    coinText: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#054363",
    },
    loadingContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 10,
    },
    loadingText: {
      marginLeft: 8,
      fontSize: 16,
      color: "#054363",
    },
    closeButton: {
      position: "absolute",
      top: 40,
      right: 20,
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      borderRadius: 20,
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10,
    },
    closeButtonText: {
      color: "#fff",
      fontSize: 24,
      fontWeight: "bold",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 30,
      paddingHorizontal: 20,
    },
    title: {
      fontSize: 20,
      fontWeight: "bold",
      color: "#fff",
    },
  });

  return (
    <Modal
      visible={menuState.isMenuOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={handleMenuClose}
    >
      <SafeAreaView style={styles.overlay}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleMenuClose}
          activeOpacity={0.7}
        >
          <Text style={styles.closeButtonText}>×</Text>
        </TouchableOpacity>

        <ScrollView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>منو</Text>
          </View>

          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemContent}>
                {typeof item.title === "string" ? (
                  <Text style={styles.menuItemText}>{item.title}</Text>
                ) : (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.coinText}>الماس: </Text>
                    {item.title}
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}