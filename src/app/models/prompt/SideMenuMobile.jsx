import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  TouchableWithoutFeedback,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

const SideMenuMobile = ({ 
  children, 
  isDarkMode, 
  setMobileHistoryMenu,
  visible = true 
}) => {
  const navigation = useNavigation();

  const handleClose = () => {
    setMobileHistoryMenu(false);
  };

  const navigateTo = (route) => {
    handleClose();
    navigation.navigate(route);
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    menuContainer: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 80 : 60,
      right: 0,
      width: '66%',
      height: 450,
      borderTopRightRadius: 20,
      borderBottomRightRadius: 20,
      backgroundColor: isDarkMode ? '#141414' : '#cbd6dd',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    contentContainer: {
      flex: 1,
    },
    topSection: {
      height: 50,
      justifyContent: 'center',
      paddingHorizontal: 15,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#333' : '#ddd',
    },
    closeButton: {
      position: 'absolute',
      left: 15,
      zIndex: 1,
    },
    historyContainer: {
      flex: 1,
      paddingTop: 20,
      paddingBottom: 10,
    },
    bottomNav: {
      backgroundColor: isDarkMode ? '#374151' : '#e5e7eb',
      borderBottomRightRadius: 20,
      paddingVertical: 10,
    },
    navGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    navButton: {
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 5,
    },
    navIcon: {
      marginBottom: 4,
    },
    navText: {
      fontSize: 10,
      color: isDarkMode ? '#ffffff' : '#000000',
      fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    childrenContainer: {
      flex: 1,
      paddingBottom: 70, // فضا برای نویگیشن پایین
    },
  });

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <StatusBar
            backgroundColor="rgba(0, 0, 0, 0.3)"
            barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          />
          
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.menuContainer}>
              <View style={styles.contentContainer}>
                {/* Top Section with Close Button */}
                <View style={styles.topSection}>
                  <TouchableOpacity 
                    style={styles.closeButton} 
                    onPress={handleClose}
                  >
                    <Icon 
                      name="close" 
                      size={30} 
                      color={isDarkMode ? "#fff" : "#000"} 
                    />
                  </TouchableOpacity>
                  <Text style={{ 
                    color: isDarkMode ? '#fff' : '#000', 
                    textAlign: 'center',
                    fontSize: 16,
                    fontWeight: 'bold'
                  }}>
                    تاریخچه
                  </Text>
                </View>

                {/* Children Content (History) */}
                <ScrollView 
                  style={styles.historyContainer}
                  contentContainerStyle={styles.childrenContainer}
                  showsVerticalScrollIndicator={false}
                >
                  {children}
                </ScrollView>

                {/* Bottom Navigation */}
                <View style={styles.bottomNav}>
                  <View style={styles.navGrid}>
                    <TouchableOpacity
                      style={styles.navButton}
                      onPress={() => navigateTo('Home')}
                    >
                      <Icon 
                        name="home-outline" 
                        size={24} 
                        color={isDarkMode ? '#ffffff' : '#000000'} 
                        style={styles.navIcon}
                      />
                      <Text style={styles.navText}>خانه</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.navButton}
                      onPress={() => navigateTo('Tickets')}
                    >
                      <Icon 
                        name="help-circle-outline" 
                        size={24} 
                        color={isDarkMode ? '#ffffff' : '#000000'} 
                        style={styles.navIcon}
                      />
                      <Text style={styles.navText}>پشتیبانی</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.navButton}
                      onPress={() => navigateTo('Profile')}
                    >
                      <Icon 
                        name="person-outline" 
                        size={24} 
                        color={isDarkMode ? '#ffffff' : '#000000'} 
                        style={styles.navIcon}
                      />
                      <Text style={styles.navText}>پروفایل</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.navButton}
                      onPress={() => navigateTo('Login')}
                    >
                      <Icon 
                        name="exit-outline" 
                        size={24} 
                        color={isDarkMode ? '#ffffff' : '#000000'} 
                        style={styles.navIcon}
                      />
                      <Text style={styles.navText}>خروج</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default SideMenuMobile;