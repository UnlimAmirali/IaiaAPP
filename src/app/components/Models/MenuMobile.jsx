import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  Animated,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useApp } from '../../context/AppContext';
import { createMMKV } from 'react-native-mmkv';

import { SvgUri } from 'react-native-svg';
import PromptSvg from '../../assets/models/prompt.svg';
import ImageSvg from '../../assets/models/image.svg';
import VoiceSvg from '../../assets/models/voice.svg';
import VideoSvg from '../../assets/models/video.svg';
import MenuSvg from '../../assets/menu.svg';
// import AsyncStorage from '@react-native-async-storage/async-storage';

import axios from "axios";
import Icon from 'react-native-vector-icons/Ionicons';
import Config from 'react-native-config';
const { width, height } = Dimensions.get('window');

export default function MobileMenu({ ParentSetIsOpenSideMen }) {
  const [menuData, setMenuData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isDarkMode, language } = useApp();
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);
  const navigation = useNavigation();
  const slideAnim = useRef(new Animated.Value(-height)).current;
  const storage = new createMMKV();

  const apiUrl = Config.API_URL;
  const refererUrl = Config.Referer_URL;
  const hostUrl = Config.Host_URL; 
  const stremUrl = Config.Host_for_strem

  const extractAllItems = useCallback((data) => {
    if (!data) return [];
    let items = [];
    console.log("items------->", data);

    try {
      Object.values(data).forEach(category => {
        if (category?.img_url) {
          items.push({
            image: category.img_url,
            title: category.title,
            type: category.type_slug,
            link: category.slug,
            cat_title: category.cat_title || ''
          });
        }

        if (category?.children) {
          Object.values(category.children).forEach(childGroup => {
            if (childGroup?.cat_title) {
              Object.values(childGroup).forEach(child => {
                if (child && typeof child === 'object' && child.title) {
                  if (child.img_url) {
                    items.push({
                      image: child.img_url,
                      title: child.title,
                      type: child.type_slug || category.type_slug,
                      link: child.slug,
                      cat_title: childGroup.cat_title,
                      is_lock: child.is_lock,
                      is_wallet: child.is_wallet,
                      icon: child.icon_url || child.img_url
                    });
                  }

                  if (child.children) {
                    Object.values(child.children).forEach(grandChild => {
                      if (grandChild && grandChild.title) {
                        items.push({
                          image: grandChild.img_url || child.img_url || category.img_url,
                          title: grandChild.title,
                          type: grandChild.type_slug || child.type_slug || category.type_slug,
                          link: grandChild.slug,
                          cat_title: childGroup.cat_title,
                          is_lock: grandChild.is_lock,
                          is_wallet: child.is_wallet,
                          icon: grandChild.icon_url || child.img_url || category.img_url
                        });
                      }
                    });
                  }
                }
              });
            } else {
              Object.values(childGroup).forEach(child => {
                if (child?.img_url) {
                  items.push({
                    image: child.img_url,
                    title: child.title,
                    type: child.type_slug || category.type_slug,
                    link: child.slug,
                    cat_title: '',
                    is_lock: child.is_lock,
                    icon: child.icon_url || child.img_url
                  });
                }

                if (child?.children) {
                  Object.values(child.children).forEach(grandChild => {
                    if (grandChild?.title) {
                      items.push({
                        image: grandChild.img_url || child.img_url || category.img_url,
                        title: grandChild.title,
                        type: grandChild.type_slug || child.type_slug || category.type_slug,
                        link: grandChild.slug,
                        cat_title: '',
                        is_lock: grandChild.is_lock,
                        icon: grandChild.icon_url || grandChild.img_url || child.img_url
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });
    } catch (error) {
      console.error("Error extracting menu items:", error);
    }

    return items;
  }, []);

  const groupItemsByCategory = useCallback((items, type) => {
    if (!items || !items.length) return {};

    const filteredItems = items.filter(item => {
      if (item.type !== type) return false;
      if (type === "prompt") return true;
      if (!item.image) return false;
      return true;
    });

    const groupedItems = filteredItems.reduce((groups, item) => {
      const category = item.cat_title || 'سایر مدل ها';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
      return groups;
    }, {});

    Object.values(groupedItems).forEach(categoryItems => {
      categoryItems.sort((a, b) => a.title?.localeCompare(b.title || '') || 0);
    });

    return groupedItems;
  }, []);

  const menuDataExtract = useMemo(() => {
    if (!menuData) return [];
    return extractAllItems(menuData);
  }, [menuData, extractAllItems]);

  const groupedMenuData = useMemo(() => {
    if (!activeFilter || !menuDataExtract.length) return {};
    return groupItemsByCategory(menuDataExtract, activeFilter);
  }, [activeFilter, menuDataExtract, groupItemsByCategory]);

  const toggleSubMenu = async (filter) => {
    if (activeFilter === filter && isSubMenuOpen) {
      closeSubMenu();
    } else {
      setActiveFilter(filter);
      setIsSubMenuOpen(true);
      
      const menuTypeMap = {
        'prompt': '1',
        'image': '2',
        'video': '3',
        'voice': '4'
      };
      
      try {
        // await AsyncStorage.setItem("currentMenuType", menuTypeMap[filter] || '0');
        storage.set("currentMenuType", menuTypeMap[filter] || '0')
      } catch (error) {
        console.log("Error saving menu type:", error);
      }
    }
  };

  const closeSubMenu = useCallback(() => {
    setIsSubMenuOpen(false);
    setTimeout(() => setActiveFilter(null), 300);
  }, []);

  useEffect(() => {
    
    const fetchMenuData = async () => {
      try {
        setIsLoading(true);
        // const token = await AsyncStorage.getItem("token") || "";
        const token = storage.getString("token") || null
          // Alert.alert("","in menu item")
          const headers = {
          ...(token ? { Authorization: token } : {}),
          Referer: refererUrl, 
          Host:stremUrl,
          // 'X-App-Referrer': 'HomeScreen', // 

          };
          const config = { headers };
        const response = await axios.get(
          `${apiUrl}/?action=cat-menu&lang=${language}&style=${isDarkMode ? "dark" : "light"}`,
          config
        );
        setMenuData(response.data.data);
      } catch (error) {
        console.error("Error fetching menu data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenuData();
  }, [isDarkMode, language]);

  useEffect(() => {
    const loadSavedMenuType = async () => {
      try {
        // const savedMenuType = await AsyncStorage.getItem("currentMenuType");
        const savedMenuType = storage.getString("currentMenuType")
        const menuTypeMap = {
          '1': 'prompt',
          '2': 'image',
          '3': 'video',
          '4': 'voice'
        };
        
        if (savedMenuType && menuTypeMap[savedMenuType]) {
          setActiveFilter(menuTypeMap[savedMenuType]);
        }
      } catch (error) {
        console.error("Error loading menu type:", error);
      }
    };

    loadSavedMenuType();
  }, []);

  useEffect(() => {
    if (isSubMenuOpen) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -height,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isSubMenuOpen]);

  const renderSubMenuItems = () => {
    if (!activeFilter || !groupedMenuData) return null;

    const categoryEntries = Object.entries(groupedMenuData);
 
    const MenuItemIcon = ({ uri, index }) => {
      const [visible, setVisible] = useState(false);

      useEffect(() => {
        const t = setTimeout(() => setVisible(true), index * 150); // هر آیتم با تأخیر ۵۰ms
        return () => clearTimeout(t);
      }, [index]);

      if (!visible) {
        return <View style={{ width: 30, height: 30, borderRadius: 6 }} />;
      }

      return (
        <SvgUri
          width="100%"
          height="100%"
          uri={uri}
        />
      );
    };    

    return (
      <ScrollView 
        style={styles.subMenuContent}
        showsVerticalScrollIndicator={false}
      >
        {categoryEntries.map(([category, items]) => (
          <View key={category} style={styles.categoryContainer}>
            <Text style={styles.categoryTitle}>{category}</Text>
            <View style={styles.itemsContainer}>
              {items
                .filter(item => item.link !== "chat-ai")
                .map((item, index) => (
                  <TouchableOpacity
                    key={`${category}-${index}`}
                    style={styles.menuItem}
                    onPress={() => {
                      closeSubMenu();
                      navigation.navigate("Models",{slug:item.link});
                    }}
                  >
                    <View style={styles.itemImageContainer}>
                      {/* <Image
                        source={{ uri: item.icon || 'https://via.placeholder.com/40' }}
                        style={styles.itemImage}
                        defaultSource={require('../../../../assets/home/chatgpt.png')}
                      /> */}
                        {/* <SvgUri
                          width="100%"
                          height="100%"
                          uri={item.icon}
                        /> */}
                      {/* <View style={styles.itemImageContainer}> */}
                        <MenuItemIcon uri={item.icon} index={index} />
                      {/* </View> */}
                    </View>
                    <View style={styles.itemTextContainer}>
                      <Text style={styles.itemTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };

  const getFilterIcon = (filter) => {
    switch(filter) {
      case 'prompt': return <PromptSvg width="100%" height="100%" />;
      case 'image': return <ImageSvg width="100%" height="100%" />;
      case 'video': return <VideoSvg width="100%" height="100%" />;
      case 'voice': return <VoiceSvg width="100%" height="100%" />
      default: return 'apps';
    }
  };

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 998,
    },
    subMenuContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: '#374151',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: height * 0.6,
      zIndex: 1001,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
    subMenuContent: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    categoryContainer: {
      marginBottom: 20,
    },
    categoryTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: '#fff',
      marginBottom: 10,
      paddingBottom: 5,
      borderBottomWidth: 1,
      borderBottomColor: '#6b7280',
    },
    itemsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    menuItem: {
      width: '48%',
      backgroundColor: '#fff',
      borderRadius: 10,
      marginBottom: 10,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    itemImageContainer: {
      width: 40,
      height: 40,
      backgroundColor: '#054363',
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    itemImage: {
      width: 30,
      height: 30,
      resizeMode: 'contain',
    },
    itemTextContainer: {
      flex: 1,
    },
    itemTitle: {
      fontSize: 12,
      fontWeight: '500',
      color: '#000',
    },
    bottomMenu: {
      position:'relative',
      backgroundColor: '#000',
      borderTopWidth: 1,
      borderTopColor: '#374151',
      paddingVertical: 12,
      paddingHorizontal: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 1004,
    },
    menuButton: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 8,
      borderRadius: 8,
      minWidth: 56,
    },
    activeMenuButton: {
      backgroundColor: '#054363',
    },
    menuIcon: {
      marginBottom: 0,
    },
    menuButtonText: {
      fontSize: 10,
      color: '#fff',
      marginTop: 2,
    },
    loadingContainer: {
      padding: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    subMenuHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#4b5563',
    },
    subMenuTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#fff',
    },
    closeButton: {
      padding: 4,
    },
  });

  return (
    <View style={styles.container}>
      <Modal
        visible={isSubMenuOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={closeSubMenu}
      >
        <TouchableOpacity 
          style={styles.overlay}
          activeOpacity={1}
          onPress={closeSubMenu}
        />
        <View style={styles.subMenuContainer}>
          <View style={styles.subMenuHeader}>
            <Text style={styles.subMenuTitle}>
              {activeFilter === "image" && "تصویر"}
              {activeFilter === "video" && "ویدیو"}
              {activeFilter === "voice" && "صدا"}
              {activeFilter === "prompt" && "پرمپت"}
            </Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={closeSubMenu}
            >
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={{ color: '#fff', marginTop: 12 }}>
                در حال بارگذاری...
              </Text>
            </View>
          ) : (
            renderSubMenuItems()
          )}
        </View>
      </Modal>

      <View style={styles.bottomMenu}>
        {["prompt", "image", "video", "voice"].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.menuButton,
              activeFilter === filter && isSubMenuOpen && styles.activeMenuButton
            ]}
            onPress={() => toggleSubMenu(filter)}
          >
            {/* <Icon 
              name={getFilterIcon(filter)} 
              size={24} 
              color="#fff" 
              style={styles.menuIcon}
            /> */}
            {/* <SvgUri
              width="100%"
              height="100%"
              uri={PromptSvg}
            /> */}
            {getFilterIcon(filter)}
            {/* <PromptSvg width="100%" height="100%" /> */}
            {/* <Image
              src='../../assets/models/prompt.png'
              /> */}
            {/* <Text style={styles.menuButtonText}>
              {filter === "image" && "تصویر"}
              {filter === "video" && "ویدیو"}
              {filter === "voice" && "صدا"}
              {filter === "prompt" && "پرمپت"}
            </Text> */}
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => {ParentSetIsOpenSideMen()}}
          delayPressIn={0}
          hitSlop={{ // افزایش ناحیه لمسی (ترجیحاً این یکی)
              top: 20,
              left: 20,
              bottom: 20,
              right: 20
          }}
        >
          {/* <Icon name="menu" size={24} color="#fff" style={styles.menuIcon} /> */}
          <MenuSvg  style={styles.menuIcon} />
          {/* <Text style={styles.menuButtonText}>منو</Text> */}
        </TouchableOpacity>
      </View>
    </View>
  );
}