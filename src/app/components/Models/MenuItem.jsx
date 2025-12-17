import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  FlatList,
  Alert
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Config from 'react-native-config';
import { useApp } from '../../context/AppContext';
// import AsyncStorage from '@react-native-async-storage/async-storage';
import { createMMKV } from 'react-native-mmkv';

import axios from "axios";
import Icon from 'react-native-vector-icons/Ionicons';

export default function MenuItem({ onMenuToggle, isMenuOpenParent, modelType }) {
    const [menuData, setMenuData] = useState(null);
    const [menuDataExtract, setMenuDataExtract] = useState([]);
    const [activeFilter, setActiveFilter] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const { isDarkMode, language } = useApp();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigation = useNavigation();
    const storage = new createMMKV();
    const apiUrl = Config.API_URL;
    const toggleMenu = (filter) => {
        if (activeFilter === filter) {
            const newState = !isMenuOpen;
            setIsMenuOpen(newState);
            if (onMenuToggle) onMenuToggle(newState);
        } else {
            setActiveFilter(filter);
            setIsMenuOpen(true);
            if (onMenuToggle) onMenuToggle(true);
        }
    };

    const extractAllItems = (data) => {
        if (!data) return [];
        let items = [];
        
        Object.values(data).forEach(category => {
            if (category.img_url) {
                items.push({
                    image: category.img_url,
                    title: category.title,
                    type: category.type_slug,
                    link: category.slug,
                    cat_title: category.cat_title || ''
                });
            }

            if (category.children) {
                Object.values(category.children).forEach(childGroup => {
                    if (childGroup.cat_title) {
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
                                                icon: grandChild.icon_url || child.img_url || category.img_url,
                                            });
                                        }
                                    });
                                }
                            }
                        });
                    } else {
                        Object.values(childGroup).forEach(child => {
                            if (child && child.img_url) {
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

                            if (child && child.children) {
                                Object.values(child.children).forEach(grandChild => {
                                    if (grandChild && grandChild.title) {
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
        
        return items;
    };

    useEffect(() => {
        
        const fetchMenuData = async () => {
            try {
                // const token = await AsyncStorage.getItem("token") || "";
                const token = storage.getString("token") || null
                // Alert.alert("","in menu item")
                const headers = {
                ...(token ? { Authorization: token } : {}),
                Referer: 'https://test.irani-ai.com/', // 
                Host:"api2.irani-ai.com"
                // 'X-App-Referrer': 'HomeScreen', // 

                };

                const config = { headers };
                // const config = token ? { headers: { 'Authorization': token } } : {};

                setIsLoading(true);
                const response = await axios.get(
                    `${apiUrl}/?action=cat-menu&lang=${language}&style=${isDarkMode ? "dark" : "light"}`,
                    config
                );
                setMenuData(response.data.data);
                console.log(response)
                console.log(config)
            } catch (error) {
                const token = storage.getString("token") || null
                const headers = {
                ...(token ? { Authorization: token } : {}),
                Referer: 'https://www.irani-ai.com/', // هر چیزی که خودت می‌خوای
                // 'X-App-Referrer': 'HomeScreen', // پیشنهاد بهتر: هدر کاستوم
                };

                const config = { headers };
            
                console.log("req", `${apiUrl}/?action=cat-menu&lang=${language}&style=${isDarkMode ? "dark" : "light"}`)
                console.log(config)
                console.log("Error fetching menu data:", error);
                

                if (error.response?.status === 307) {
                    navigation.navigate("Maintenance");
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchMenuData();
    }, [isDarkMode, language]);

    useEffect(() => {
        if (isMenuOpenParent === false) {
            const menuTypeMap = {
                '1': 'prompt',
                '2': 'image',
                '3': 'video',
                '4': 'voice'
            };
            setActiveFilter(menuTypeMap[modelType]);
        }
    }, [isMenuOpenParent]);

    useEffect(() => {
        if (modelType) {
            const menuTypeMap = {
                '1': 'prompt',
                '2': 'image',
                '3': 'video',
                '4': 'voice'
            };
            
            if (menuTypeMap[modelType]) {
                setActiveFilter(menuTypeMap[modelType]);
            }
        }
    }, [modelType]);

    useEffect(() => {
        if (menuData) {
            const allItems = extractAllItems(menuData);
            setMenuDataExtract(allItems);
        }
    }, [menuData]);

    const renderButtons = () => (
        <View style={styles.buttonsContainer}>
            <TouchableOpacity 
                style={styles.button}
                onPress={() => navigation.navigate("Tools")}
            >
                <Image 
                    source={require('../../assets/models/home.png')} // باید مسیر تصویر شما باشد
                    style={styles.buttonImage}
                />
            </TouchableOpacity>
            
            {["voice", "video", "image", "prompt"].map((filter) => (
                <TouchableOpacity 
                    key={filter}
                    style={styles.button}
                    onPress={() => toggleMenu(filter)}
                >
                    <View style={[
                        styles.buttonImageContainer,
                        activeFilter === filter && styles.activeButton
                    ]}>
                        <Image 
                            source={getFilterImage(filter)}
                            style={styles.buttonImage}
                        />
                    </View>
                </TouchableOpacity>
            ))}
        </View>
    );

    const getFilterImage = (filter) => {
        // باید تصاویر مربوطه را ایمپورت کنید
        switch(filter) {
            case 'voice': return require('../../assets/models/voice.png');
            case 'video': return require('../../assets/models/video.png');
            case 'image': return require('../../assets/models/image.png');
            case 'prompt': return require('../../assets/models/prompt.png');
            default: return require('../../assets/models/home.png');
        }
    };

    const renderMenuItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {
                setIsMenuOpen(false);
                if (onMenuToggle) onMenuToggle(false);
                navigation.navigate(item.link);
            }}
        >
            <View style={styles.itemImageContainer}>
                <Image 
                    source={{ uri: item.icon || 'https://via.placeholder.com/50' }}
                    style={styles.itemImage}
                    defaultSource={require('../../assets/home/chatgpt.png')}
                />
            </View>
            <View style={styles.itemContent}>
                <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                <View style={styles.itemIcons}>
                    {item.is_lock ? (
                        <Icon name="lock-closed" size={16} color="#666" />
                    ) : item.is_wallet ? (
                        <Icon name="wallet" size={16} color="#666" />
                    ) : null}
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderMenuContent = (type) => {
        if (!menuDataExtract.length) return null;
        
        const filteredItems = menuDataExtract.filter(item => item.type === type);
        
        const groupedItems = filteredItems.reduce((groups, item) => {
            const category = item.cat_title || 'سایر مدل ها';
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(item);
            return groups;
        }, {});

        // مرتب‌سازی هر گروه
        Object.keys(groupedItems).forEach(category => {
            groupedItems[category].sort((a, b) => a.title.localeCompare(b.title));
        });

        return (
            <ScrollView style={styles.menuContent}>
                {Object.entries(groupedItems).map(([category, items]) => (
                    <View key={category} style={styles.categorySection}>
                        <Text style={[
                            styles.categoryTitle,
                            { color: isDarkMode ? '#fff' : '#000' }
                        ]}>
                            {category}
                        </Text>
                        <View style={styles.categoryGrid}>
                            {items
                                .filter(item => item.link !== "chat-ai")
                                .map((item, index) => (
                                    <View key={`${category}-${index}`} style={styles.gridItem}>
                                        {renderMenuItem({ item })}
                                    </View>
                                ))}
                        </View>
                    </View>
                ))}
            </ScrollView>
        );
    };

    const styles = StyleSheet.create({
        container: {
            position: 'relative',
        },
        buttonsContainer: {
            flexDirection: 'row',
            justifyContent: 'space-around',
            alignItems: 'center',
            backgroundColor: isDarkMode ? '#141414' : '#99aabd',
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 5,
            marginHorizontal: 10,
            maxWidth: 500,
            alignSelf: 'center',
        },
        button: {
            flex: 1,
            alignItems: 'center',
            paddingTop: 4,
        },
        buttonImageContainer: {
            padding: 12,
            borderRadius: 8,
        },
        buttonImage: {
            width: 24,
            height: 24,
        },
        activeButton: {
            backgroundColor: '#054363',
        },
        overlay: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: isDarkMode ? 'rgba(0,0,0,0.9)' : 'rgba(243,240,240,0.9)',
        },
        menuModal: {
            position: 'absolute',
            top: 60,
            left: 10,
            right: 10,
            backgroundColor: isDarkMode ? '#374151' : '#e9e9f4',
            borderRadius: 8,
            maxHeight: 400,
            padding: 20,
            zIndex: 40,
            elevation: 40,
        },
        menuContent: {
            flex: 1,
        },
        categorySection: {
            marginBottom: 20,
        },
        categoryTitle: {
            fontSize: 14,
            fontWeight: '600',
            marginBottom: 10,
            paddingBottom: 5,
            borderBottomWidth: 1,
            borderBottomColor: '#6b7280',
        },
        categoryGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
        },
        gridItem: {
            width: '32%',
            marginBottom: 10,
        },
        menuItem: {
            flexDirection: 'row',
            backgroundColor: '#fff',
            borderRadius: 8,
            height: 50,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
        },
        itemImageContainer: {
            width: '33%',
            backgroundColor: '#054363',
            justifyContent: 'center',
            alignItems: 'center',
            borderTopRightRadius: 8,
            borderBottomRightRadius: 8,
        },
        itemImage: {
            width: '100%',
            height: 50,
            resizeMode: 'contain',
        },
        itemContent: {
            flex: 1,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 10,
        },
        itemTitle: {
            fontSize: 12,
            fontWeight: '500',
            color: '#000',
            flex: 1,
        },
        itemIcons: {
            width: 24,
            alignItems: 'center',
        },
        loadingContainer: {
            padding: 20,
            alignItems: 'center',
        },
    });

    return (
        <View style={styles.container}>
            {renderButtons()}

            <Modal
                visible={isMenuOpen}
                transparent={true}
                animationType="fade"
                onRequestClose={() => {
                    setIsMenuOpen(false);
                    if (onMenuToggle) onMenuToggle(false);
                }}
            >
                <TouchableOpacity 
                    style={styles.overlay}
                    activeOpacity={1}
                    onPress={() => {
                        setIsMenuOpen(false);
                        if (onMenuToggle) onMenuToggle(false);
                    }}
                >
                    <View style={styles.menuModal}>
                        {isLoading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator 
                                    size="large" 
                                    color={isDarkMode ? "#fff" : "#000"} 
                                />
                                <Text style={{ color: isDarkMode ? "#fff" : "#000", marginTop: 10 }}>
                                    Loading...
                                </Text>
                            </View>
                        ) : (
                            activeFilter && renderMenuContent(activeFilter)
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}