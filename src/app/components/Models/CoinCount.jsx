import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Ionicons";
import { useApp } from "../../context/AppContext";
// import AsyncStorage from "@react-native-async-storage/async-storage";
import { createMMKV } from 'react-native-mmkv';
import Config from 'react-native-config';
import axios from "axios";

export default function MenuTop({ isDarkMode }) {
  const [coin, setCoin] = useState(0);
  const [isLogin, setIsLogin] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation();
  const { language } = useApp();
  const storage = new createMMKV();
  const apiUrl = Config.API_URL;

  const fetchCoin = useCallback(async () => {
    try {
      setIsLoading(true);
      // const token = await AsyncStorage.getItem("token");
      const token = storage.getString("token")
      
      if (!token) {
        setIsLogin(false);
        setCoin(0);
        setIsLoading(false);
        return;
      }

      const response = await axios.get(
        `${apiUrl}/wallet/coins/?lang=${language}&style=${isDarkMode ? "dark" : "light"}`,
        {
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data?.data) {
        setCoin(response.data.data.coins || 0);
        setIsLogin(true);
      }
    } catch (error) {
      console.error("Error fetching coin data:", error);
      setCoin(0);
      
      // بررسی اینکه آیا خطا به دلیل عدم احراز هویت است
      if (error.response?.status === 401 || error.response?.status === 403) {
        setIsLogin(false);
        // پاک کردن توکن نامعتبر
        // await AsyncStorage.removeItem("token");
        storage.remove("token")
      }
    } finally {
      setIsLoading(false);
    }
  }, [isDarkMode, language]);

  const handleProfilePress = () => {
    if (isLogin) {
      navigation.navigate("Dashboard", { screen: "Profile" });
    } else {
      navigation.navigate("Login");
    }
  };

  const handleBuyCreditPress = () => {
    if (isLogin) {
      navigation.navigate("Dashboard", { screen: "BuyCredit" });
    } else {
      navigation.navigate("Login");
    }
  };

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        // const token = await AsyncStorage.getItem("token");
        const token = storage.getString("token");
        setIsLogin(!!token);
      } catch (error) {
        console.error("Error checking login status:", error);
        setIsLogin(false);
      }
    };

    checkLoginStatus();
    fetchCoin();
  }, [fetchCoin]);

  // رفرش سکه‌ها هنگام بازگشت به صفحه
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchCoin();
    });

    return unsubscribe;
  }, [navigation, fetchCoin]);

  const formatCoinNumber = (number) => {
    if (number >= 1000000) {
      return (number / 1000000).toFixed(1) + 'M';
    }
    if (number >= 1000) {
      return (number / 1000).toFixed(1) + 'K';
    }
    return number.toString();
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 15,
      marginTop: 10,
      backgroundColor: "transparent",
    },
    profileContainer: {
      width: "25%",
      alignItems: "center",
      justifyContent: "center",
    },
    profileButton: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: isDarkMode ? "#333" : "#f0f0f0",
    },
    coinContainer: {
      width: "50%",
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
    },
    coinButton: {
      backgroundColor: isDarkMode ? "#374151" : "#7e94b7",
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      width: "100%",
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
    },
    coinText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
      textAlign: "center",
    },
    loadingContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    loadingText: {
      color: "#fff",
      marginLeft: 8,
      fontSize: 14,
    },
    coinValue: {
      color: "#FFD700", // رنگ طلایی برای الماس
      fontSize: 18,
      fontWeight: "bold",
      marginLeft: 4,
    },
    diamondIcon: {
      marginRight: 4,
    },
  });

  return (
    <SafeAreaView>
      <View style={styles.container}>
        {/* Profile Button */}
        <View style={styles.profileContainer}>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={handleProfilePress}
            activeOpacity={0.7}
          >
            <Icon
              name="person"
              size={28}
              color={isDarkMode ? "#fff" : "#000"}
            />
          </TouchableOpacity>
        </View>

        {/* Coin Display */}
        <View style={styles.coinContainer}>
          <TouchableOpacity
            style={styles.coinButton}
            onPress={handleBuyCreditPress}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.loadingText}>در حال بارگذاری...</Text>
              </View>
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Icon
                  name="diamond"
                  size={20}
                  color="#FFD700"
                  style={styles.diamondIcon}
                />
                <Text style={styles.coinText}>
                  الماس:{" "}
                  <Text style={styles.coinValue}>
                    {coin === null || coin === 0
                      ? "0"
                      : formatCoinNumber(coin)}
                  </Text>
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Placeholder for grid layout - در React Native معمولاً از flex استفاده می‌کنیم */}
        <View style={{ width: "25%" }} />
      </View>
    </SafeAreaView>
  );
}