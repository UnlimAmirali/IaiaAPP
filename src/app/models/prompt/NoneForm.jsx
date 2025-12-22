import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActivityIndicator,
  Animated,
  Easing,
  TouchableWithoutFeedback
} from "react-native";
import { Keyboard } from 'react-native';
import Config from 'react-native-config';
import { FlatList } from "react-native";
import { fetch as fetchPolyfill } from 'react-native-fetch-api';
// import AsyncStorage from "@react-native-async-storage/async-storage";
import { createMMKV } from 'react-native-mmkv';
import axios from "axios";
import { SvgUri } from 'react-native-svg';
import Icon from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
// import FontAwesome from "react-native-vector-icons/FontAwesome";
import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";

// import * as ImagePicker from "expo-image-picker";
import { WebView } from "react-native-webview";
import Markdown from "react-native-markdown-display";
import Toast from "react-native-toast-message";

import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import { pick, types ,saveDocuments } from '@react-native-documents/picker'

import MenuTop from '../../components/Models/MenuTopMobile'

const { width, height } = Dimensions.get("window");
const storage = new createMMKV();
const apiUrl = Config.API_URL;
// کامپوننت Tooltip سفارشی
const Tooltip = ({ children, text, show, position = "top", autoHide = true, autoHideDuration = 5000, onHide }) => {
  const [internalShow, setInternalShow] = useState(show);

  useEffect(() => {
    setInternalShow(show);
    if (show && autoHide) {
      const timer = setTimeout(() => {
        setInternalShow(false);
        onHide?.();
      }, autoHideDuration);
      return () => clearTimeout(timer);
    }
  }, [show, autoHide, autoHideDuration, onHide]);

  if (!internalShow) return children;

  const positionStyles = {
    top: { bottom: "100%", left: "50%", transform: [{ translateX: -50 }], marginBottom: 4 },
    bottom: { top: "100%", left: "50%", transform: [{ translateX: -50 }], marginTop: 2 },
    left: { bottom: 30, left: "50%", marginLeft: 2, transform: [{ translateX: -50 }], marginBottom: 2, marginRight: 40 },
    right: { left: "100%", top: "50%", transform: [{ translateY: -12 }], marginLeft: 2 },
  };

  return (
    <View style={{ position: "relative" }}>
      {children}
      <View style={[styles.tooltipContainer, positionStyles[position]]}>
        <Text style={styles.tooltipText}>{text}</Text>
      </View>
    </View>
  );
};

// کامپوننت Bubble (نمونه ساده)
const BubbleComponent = ({ items }) => {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bubbleContainer}>
      {items.map((item, index) => (
        <TouchableOpacity key={index} style={styles.bubbleItem}>
          <Image source={{ uri: item.icon }} style={styles.bubbleIcon} />
          <Text style={styles.bubbleText}>{item.title}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// کامپوننت SideMenuMobile
const SideMenuMobile = ({ children, isDarkMode, setMobileHistoryMenu, ParenHandleSideBar }) => {
  return (
    <View style={{direction:'rtl', backgroundColor:'#000', width:'100%'}} >
    <Modal
     animationType="fade" transparent={true} visible={true} 
    //  onDismiss={() => setMobileHistoryMenu(false)}
    //  style={[styles.sideMenuParent]}
     onRequestClose={() => ParenHandleSideBar()}
     >

        {/* <TouchableWithoutFeedback 
          onPress={() => setModalVisible(false)}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback> */}
      <View style={[styles.sideMenuContainer]}>
        <TouchableOpacity style={styles.closeButton} onPress={() => ParenHandleSideBar()}>
          <Icon name="close" size={30} color={isDarkMode ? "#fff" : "#000"} />
        </TouchableOpacity>
        <View style={[styles.historyParent]}>
        <ScrollView>{children}</ScrollView>
        </View>
      </View>
    </Modal>
    </View>
  );
};


// const FilePicker = ({ children, isDarkMode, setMobileHistoryMenu }) => {
//   return (
//     <Modal animationType="fade" transparent={false} visible={true}>
//       <View style={[styles.filePicker, isDarkMode ? styles.darkBg : styles.lightBg]}>
//         <TouchableOpacity style={styles.closeButton} onPress={() => setMobileHistoryMenu(false)}>
//           <Icon name="close" size={30} color={isDarkMode ? "#fff" : "#000"} />
//         </TouchableOpacity>
//         <ScrollView>{children}</ScrollView>
//       </View>
//     </Modal>
//   );
// };

export default function RegularModel({ ModelPageData, ParentSideMenuState, ParenHandleSideBar }) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [inputUser, setInputUser] = useState("");
  const [isShowBaner, setIsShowBaner] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilePickerModalOpen, setIsFilePickerModalOpen]  = useState(false)
  const [selectedLLM, setselectedLLM] = useState({});
  const [showImagePickerTooltip, setShowImagePickerTooltip] = useState(false);
  const [showSendTooltip, setShowSendTooltip] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [userCredit, setUserCredit] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectHistoryBtnKey, setSelectHistoryBtnKey] = useState(0);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [sample, setSample] = useState([]);
  const [mobileHistoryMenu, setMobileHistoryMenu] = useState(false);
  const [selIsonline, setSelIsonline] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [reasonSelectSts, setReasonSelecSts] = useState(false);
  const [showReasonerBut, setShowReasonerBut] = useState(false);
  const [butnSubmit, setButnSubmit] = useState(false);
  const [language, setLanguage] = useState("fa");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const scrollViewRef = useRef();



    const MenuItemIcon = ({ uri, index }) => {
      const [visible, setVisible] = useState(false);

      useEffect(() => {
        const t = setTimeout(() => setVisible(true), index * 50); // هر آیتم با تأخیر ۵۰ms
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
  useEffect(() => {

    if (!ModelPageData) return;
    // AsyncStorage.getItem("profileChat").then((url) => setAvatar(url));
    let url  = storage.getString("profileChat");
    let profile  = storage.getString("profile");
    if(profile){
      let prf = JSON.parse(profile)
      console.log("user profile" ,prf['user_info']['user_img'])
      console.log("user profile" ,profile)
      if(prf['user_info']['user_img']){
        setAvatar(prf['user_info']['user_img'])
      }
    }

  }, []);

  useEffect(() => {
    setMobileHistoryMenu(ParentSideMenuState);
  }, [ParentSideMenuState]);

  // تنظیمات اولیه
  useEffect(() => {
    const defaultLLM = {
      id: 11,
      title: "Chatgpt o1",
      img_url: "https://www.irani-ai.com/public/images/llm/frame-460.svg",
      accept_file: 0,
      page_id: 11,
    };
    if (Object.keys(selectedLLM).length === 0) {
      setselectedLLM(defaultLLM);
    }
    fetchHistory()
  }, []);

  // useEffect(() => {
  //   if (ModelPageData && ModelPageData.llms) {
  //     ModelPageData.llms.forEach((item) => {
  //       if (item.id === parseInt(qParams)) {
  //         selectLLM(item, 1);
  //       }
  //     });
  //   }
  // }, [qParams]);

  const fetchHistory = async () => {
    try {
      const token = storage.getString("token")
      console.log("token", token)
      // await AsyncStorage.getItem("token");
      const response = await axios.get(
        `${apiUrl}/models/chat-ai/?lang=${language}&style=dark&history_limit=25`,

        {
          headers: {
            Authorization: `${token}`,
            'Content-Type': 'application/json',
            Referer: 'https://test.irani-ai.com/',
          },
          // تنظیم Host معمولاً از طریق baseURL بهتر است
          baseURL: 'https://api2.irani-ai.com',
        } 
      );
      console.log("in fetch history",response)
      if (response) {
        setHistoryConv(response);
        setHistory(response.data.data.history);
        setSample(response.data.data.pageInfo?.samples);
        if (response.data.data.history.length === 0) {
          newChat();
        }
      }
    } catch (error) {
      // console.error("Err landing data:", error);
    }
  };

  const setHistoryConv = (data) => {
    if (data) {
      setMessages([]);
      const conversationData = data?.data?.data?.history[selectHistoryBtnKey].conversation;
      const chat_id = data?.data?.data?.history[selectHistoryBtnKey].id;
      showHistory(conversationData, 0, chat_id, data?.data?.data?.history);
    }
  };

  const showHistory = (historyConv, key, chat_id, hist) => {
    
    setMessages([]);
    setSelectHistoryBtnKey(key);
    setSelectedChatId(chat_id);
    const conversationData = historyConv;
    job_not_done_check(hist[key]);
    const newMessages = Object.values(conversationData).map((message) => ({
      id: Date.now(),
      sender: message.role === "user" ? "user" : "assistant",
      content: message.content,
      llm_img: message.llm_img,
      timestamp: new Date().toLocaleTimeString(),
      is_history: true,
      img: message.img_url,
      task_id: message.task_id,
      stream_url: message.stream_url,
    }));
    setMessages(newMessages);
  };

  const delete_history = async (id) => {
    ParenHandleSideBar();
    setError(null);
    const token = storage.getString("token");
    console.log("id->",id)
    // await AsyncStorage.getItem("token");
    try {
      const response = await axios.post(
        `${apiUrl}/response/deletechathistory/`,
        { chat_id: id },
        {
          headers: {
            ...(token ? { Authorization: `${token}` } : {}),
            Referer: 'https://test.irani-ai.com/', // 
            Host:"api2.irani-ai.com",
            // "Content-Type": "multipart/form-data",
          },
        }
      );
      if (response) {
        fetchHistory();
      }
    } catch (err) {
      console.log("err" , err.response.data);
    } finally {
      setIsLoading(false);
    }
  };

  const renderSideBarHistory = () => {
    if (!history) return null;
    return history.map((histItem, key) => {
      const firstUserMessage = Object.values(histItem.conversation).find(
        (msg) => msg.role === "user"
      );
      return firstUserMessage ? (
        <View key={key} style={styles.historyItemContainer}>
          <TouchableOpacity
            style={[
              styles.historyButton,
              key === selectHistoryBtnKey && styles.selectedHistoryButton,
            ]}
            onPress={() => {showHistory(histItem.conversation, key, histItem.id, history), ParenHandleSideBar()}}
          >
            <Text numberOfLines={1} style={styles.historyText}>
              {firstUserMessage.content}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => delete_history(histItem.id)}
          >
            <MaterialIcons name="delete-outline" size={24} color="#ff4444" />
          </TouchableOpacity>
        </View>
      ) : null;
    });
  };

  const showSample = (smpl) => {
    setMessages([]);
    const conversationData = smpl.conversation;
    const newMessages = Object.values(conversationData).map((message) => ({
      id: Date.now(),
      sender: message.role === "user" ? "user" : "assistant",
      content: message.content,
      llm_img: message.llm_img,
      timestamp: new Date().toLocaleTimeString(),
      is_history: true,
      img: message.img_url,
      task_id: message.task_id,
      sample: true,
    }));
    setMessages(newMessages);
  };

  const renderSample = () => {
    if (!sample) return null;
    return sample.map((smpl, key) => (
      <TouchableOpacity key={key} style={styles.sampleButton} onPress={() => showSample(smpl)}>
        <Text style={styles.sampleText}>{smpl.title}</Text>
      </TouchableOpacity>
    ));
  };

  const handleSubmit = async () => {
    if (!inputUser.trim() && !selectedImage) return;
    Toast.hide();
    if (butnSubmit) {
      Toast.show({
        type: "info",
        text1: "درحال پاسخ به شما هستیم ... صبور باشید",
      });
      return;
    }
    // if (history.length === 0) {
    //   setInputUser("");
    //   // AsyncStorage.setItem("free_chat_id", "0");
    //   storage.set("free_chat_id","0");
    //   setSelectedChatId(0);
    //   setMessages([]);
    // }
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: "user",
        content: inputUser,
        image: selectedImage ? selectedImage.uri : null,
        timestamp: new Date().toLocaleTimeString(),
        img: imagePreview,
        isbase64: true,
      },
    ]);
    const userMessage = inputUser;
    setInputUser("");
    setIsLoading(true);
    setError(null);
    const token = storage.getString("token");
    // await AsyncStorage.getItem("token");
    
    const formData = new FormData();
    formData.append("chat-ai", userMessage);
    formData.append("online", selIsonline ? "1" : "0");
    formData.append("regenerate", "0");
   
    formData.append("id", "0");
    console.log("selectedChatId", selectedChatId)
    console.log("Storage chatid", storage.getString("chat_id"))
    if(selectedChatId == 0 && storage.getString("chat_id") != undefined && storage.getString("chat_id")!=0){
      formData.append("chat-id", storage.getString("chat_id"));
    }else{
      formData.append("chat-id", selectedChatId || (storage.getString("chat_id")) || "0");
    }
    
    formData.append("page-id", selectedLLM.page_id);
    formData.append("llm-api", selectedLLM.id);
    console.log("formData", formData)
    if (selectedImage) {
      const localUri = selectedImage.uri;
      const filename = localUri.split("/").pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image";
      formData.append("llm-file", { uri: localUri, name: filename, type });
      setSelectedImage(null);
      setImagePreview(null);
    }
    try {
      const response = await axios.post(
        `${apiUrl}/response/chatai/`,
        formData,
        {
          headers: {
            Authorization: `${token}`,
            ...(token ? { Authorization: `${token}` } : {}),
            Referer: 'https://test.irani-ai.com/', // 
            Host:"api2.irani-ai.com",
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log("handle submit ", response.data)
      if (response.data) {
        
        storage.set("task_id",String(response?.data.data.task_id))

        storage.set("chat_id",String(response?.data.data['chat-id']))
        console.log("cahtid resp",response?.data.data['chat-id'])
        console.log("chatid in resposen storg" , storage.getString("chat_id"))
        await handleStreamReader(response.data.data);
        
      }
    } catch (err) {
      console.log("err in submit",err)
      setButnSubmit(false);
      
      if (err.response && err.response.status === 403) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: "bot",
            content: "احتمالا توکن شما منقضی شده بزودی به صفحه ورود منتقل خواهید شد",
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
        // navigation.navigate("Login");
      } else {
        Toast.show({
          type: "error",
          text1: err.data?.message || "خطا در ارسال پیام",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const regenerateChat = async () => {
    Toast.hide();
    // setButnSubmit(false);

    if (butnSubmit) {
      Toast.show({
        type: "info",
        text1: "درحال پاسخ به شما هستیم ... صبور باشید",
      });
      return;
    }
    setButnSubmit(true);
    setIsLoading(true);
    setError(null);
    const token = storage.getString("token");
    // await AsyncStorage.getItem("token");
    const vonline = selIsonline ? 1 : 0;
    try {
      const response = await axios.post(
        `${apiUrl}/response/chatai/`,
        {
          "chat-ai": "",
          regenerate: selectedChatId || (storage.getString("chat_id")) || 0,
          id: 0,
          "chat-id": 0,
          "page-id": selectedLLM.page_id,
          "llm-api": selectedLLM.id,
          online: vonline,
        },
        {
          headers: {
            Authorization: `${token}`,
            ...(token ? { Authorization: `${token}` } : {}),
            Referer: 'https://test.irani-ai.com/', // 
           Host:"api2.irani-ai.com",
            "Content-Type": "multipart/form-data",
          },
        }
      );
      await handleStreamReader(response.data.data);
    } catch (err) {
      if (err.response && err.response.status === 403) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: "bot",
            content: "احتمالا توکن شما منقضی شده بزودی به صفحه ورود منتقل خواهید شد",
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
        // navigation.navigate("Login");
      } else {
        Toast.show({
          type: "error",
          text1: err.response?.data?.message || "خطا در ارسال پیام",
        });
      }
    } finally {
      setIsLoading(false);
    }
    fetchHistory();
  };

  const newChat = async () => {
    console.log("in new chat")
    setInputUser("");
    setError(null);
    // AsyncStorage.setItem("free_chat_id", "0");
    storage.set("chat_id","0")
    setSelectedChatId(0);
    setMessages([]);
  };

const handleStreamReader = async (responseData) => {
  if (!responseData) return;
  console.log("in handle strem")
  setIsLoading(true);
  // return;

  try {
    let { stream_url, task_id, "chat-id": chatID, uid, "page-id": pageID } = responseData;
  console.log(`${apiUrl}/gpu.php?task=${stream_url}&task-id=${task_id}&id=${chatID}&user=${uid}&page=${pageID}&lang=fa`);


    storage.set("free_chat_id", chatID.toString());
    console.log("")
    const response = await fetch(
      `${apiUrl}/gpu.php?task=${stream_url}&task-id=${task_id}&id=${chatID}&user=${uid}&page=${pageID}&lang=fa`,
      {
        method: "GET",
        headers: {
          Authorization: storage.getString("token") || "",
          Referer: "https://test.irani-ai.com/",
          Host: "api2.irani-ai.com",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseText = await response.text();

    const botMessageId = Date.now();
    setMessages((prev) => [
      ...prev,
      {
        id: botMessageId,
        sender: "bot",
        content: responseText,
        timestamp: new Date().toLocaleTimeString(),
        lang: "fa",
      },
    ]);

    setButnSubmit(false);
  } catch (error) {
    console.log("Error:", error);
    Toast.hide();
    setButnSubmit(false);
  } finally {
    setIsLoading(false);
  }
};




 
  const check_image_credit = async () => {
    try {
      const token = storage.getString("token")
      // await AsyncStorage.getItem("token");
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/models/chat-ai/?lang=${language}&style=dark&history_limit=25`,
        {
          headers: {
            Authorization: `${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response) {
        const credit = {
          used_count: response.data.data.used_count,
          totol_chat_count: response.data.data.total_chat_count,
          file_used_count: response.data.data.file_used_count,
          totol_file_count: response.data.data.total_file_count,
          total_file_txt: response.data.data.total_file_txt,
        };
        setUserCredit(credit);
      }
    } catch (error) {
      // console.error("Err landing data:", error)
    }
  };

  const selectLLM = (item, noneMenu = 0) => {
    if (noneMenu === 0) {
      toggleModal();
    }
    setselectedLLM(item);
    if (item.accept_file === 0) {
      removeImage();
    } else {
      // setShowImagePickerTooltip(true);
      check_image_credit();
    }
  };

  const toggleReasonerSelect = () => {
    setReasonSelecSts(!reasonSelectSts);
    if (selectedLLM.is_reasoner === 1) {
      setReasonSelecSts(true);
    } else {
      if (ModelPageData?.llms) {
        ModelPageData.llms.forEach((itm) => {
          if (itm.is_reasoner && itm.group_id === selectedLLM.group_id) {
            setselectedLLM(itm);
            setReasonSelecSts(true);
          }
        });
      }
    }
  };

  useEffect(() => {
    setShowReasonerBut(false);
    if (ModelPageData?.llms) {
      ModelPageData.llms.forEach((itm) => {
        if (selectedLLM.group_id === itm.group_id && itm.is_reasoner === 1) {
          setShowReasonerBut(true);
        }
      });
    }
  }, [selectedLLM]);

  // const handleImageUpload = async () => {
  //   const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  //   if (status !== "granted") {
  //     Alert.alert("دسترسی به گالری لازم است");
  //     return;
  //   }
  //   const result = await ImagePicker.launchImageLibraryAsync({
  //     mediaTypes: ImagePicker.MediaTypeOptions.Images,
  //     allowsEditing: true,
  //     aspect: [4, 3],
  //     quality: 1,
  //   });
  //   if (!result.canceled) {
  //     setSelectedImage(result.assets[0]);
  //     setImagePreview(result.assets[0].uri);
  //   }
  // };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const toggleFilePickerModal = ()=>{
    // console.log("test");
    setIsFilePickerModalOpen(!isFilePickerModalOpen)
  }
  const toggleModal = () =>{
      Keyboard.dismiss();
  // کمی تاخیر برای اطمینان از بسته شدن کیبورد
    setTimeout(() => {
      setIsModalOpen(!isModalOpen);
    }, 100);
  } 

  const job_not_done_check = async (hist) => {
    if (!hist || !hist.conversation) return;
    const { id: gpuId, conversation, user_id, page_id } = hist;
    for (const [key, message] of Object.entries(conversation)) {
      if (!message.content && message.task_id) {
        const dt = {
          uid: user_id,
          stream_url: message.stream_url,
          task_id: message.task_id,
          "page-id": 11,
          "chat-id": gpuId,
        };
        try {
          await handleStreamReader(dt);
          fetchHistory();
        } catch (error) {
          // console.error("Error in handleStreamReader:", error);
        }
      }
    }
  };

  const isPersian = (text) => /[\u0600-\u06FF]/.test(text);

  // const itemsB = [
  //   {
  //     title: "صفحه اصلی",
  //     icon: "https://irani-ai.com/public/images/llm/chatgpt_logo_chatgpt_logo_square_green_gpt_ia_openai_icon_264976.png",
  //     link: "./",
  //   },
  //   // ... سایر آیتم‌ها
  // ];
  useEffect(()=>{
    console.log(selectedLLM)
  },[selectLLM])
  return (
    <View style={[styles.container, isDarkMode ? styles.darkContainer : styles.lightContainer]}>
      {/* Side Menu Mobile */}
      {mobileHistoryMenu && (
        <SideMenuMobile
          isDarkMode={isDarkMode}
          setMobileHistoryMenu={setMobileHistoryMenu}
          ParenHandleSideBar={ParenHandleSideBar}
        >
        <View>
          {renderSideBarHistory()}
        </View>
        </SideMenuMobile>
      )}

      


      {/* محتوای اصلی چت */}
      <View style={[styles.mainContent, isSidebarCollapsed ? styles.mainContentExpanded : {}]}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.chatContainer}
          // contentContainerStyle={styles.chatContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {/* {messages.length === 0 && (
            <View style={styles.bubbleWrapper}>
              <BubbleComponent items={itemsB} />
            </View>
          )} */}
          {messages.map((message, index) => (
            <View
              key={index}
              style={[
                styles.messageContainer,
                message.sender === "user" ? styles.userMessage : styles.botMessage,
              ]}
            >
              {message.sender != "user" ? 
              <>


              <SvgUri
                uri={
                      message.sender === "user"
                      ?  selectedLLM?.img_url
                      :  selectedLLM?.img_url || "/default-icon.svg" 
                }        
                style={styles.avatar}
                />
              

                
              <View
                style={[
                  styles.messageBubble,
                  message.sender === "user" ? styles.userBubble : styles.botBubble,
                ]}
              >
                {message.image && <Image source={{ uri: message.image }} style={styles.messageImage} />}
                {message.sender === "assistant" || message.sender === "bot" ? (
                  <Markdown style={markdownStyles}>{message.content}</Markdown>
                ) : (
                  <Text style={styles.messageText}>{message.content}</Text>
                )}
                <Text style={styles.timestamp}>{message.timestamp}</Text>
              </View>
              </>

              :
              <>
                
              <View
                style={[
                  styles.messageBubble,
                  message.sender === "user" ? styles.userBubble : styles.botBubble,
                ]}
              >
                {message.image && <Image source={{ uri: message.image }} style={styles.messageImage} />}
                {message.sender === "assistant" || message.sender === "bot" ? (
                  <Markdown style={markdownStyles}>{message.content}</Markdown>
                ) : (
                  <Text style={styles.messageText}>{message.content}</Text>
                )}
                <Text style={styles.timestamp}>{message.timestamp}</Text>
              </View>

              <Image 
                source={avatar ? {uri: avatar} : require("../../assets/noAvatar.png")} 
                style={styles.avatarImg}
                onError={() => {/* هندل خطای لود تصویر */}}
              />
              </>}

            </View>
          ))}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={isDarkMode ? "#fff" : "#000"} />
              <Text style={styles.loadingText}>در حال پاسخ...</Text>
            </View>
          )}
          <View style={{height:50 }}></View>
        </ScrollView>

        {/* فرم ارسال پیام */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.inputContainer}
        >
          {imagePreview && (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: imagePreview }} style={styles.previewImage} />
              <TouchableOpacity onPress={removeImage} style={styles.removeImageButton}>
                <Icon name="close-circle" size={30} color="#ff4444" />
              </TouchableOpacity>
              {userCredit && (
                <Text style={styles.creditText}>
                  {userCredit.total_file_txt}
                  {"\n"}
                  {userCredit.file_used_count}/{userCredit.totol_file_count}
                </Text>
              )}
            </View>
          )}

          {/* ردیف دکمه‌ها */}
          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={toggleModal} style={styles.modelButton}>
              {/* <Image source={{ uri: selectedLLM.img_url }} style={styles.modelIcon} /> */}
              {selectedLLM.img_url && 
              <SvgUri uri={selectedLLM.img_url ||  img_url} height={25}  style={styles.modelIcon}/>
              }
              <Text numberOfLines={1} style={styles.modelButtonText}>
                {selectedLLM.title}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={newChat} style={styles.actionButton}>
              <Text style={styles.actionButtonText}>چت جدید</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={regenerateChat} style={styles.iconButton}>
              <MaterialIcons name="refresh" size={24} color={isDarkMode ? "#fff" : "#fff"} />
            </TouchableOpacity>

            {showReasonerBut && (
              <TouchableOpacity onPress={toggleReasonerSelect} style={styles.iconButton}>
                <MaterialIcons
                  name="lightbulb"
                  size={24}
                  color={selectedLLM.is_reasoner ? (isDarkMode ? "#fff" : "#000") : "#888"}
                />
              </TouchableOpacity>
            )}

            {selectedLLM.is_online === 1 && (
              <TouchableOpacity onPress={() => setSelIsonline(!selIsonline)} style={styles.iconButton}>
                <MaterialIcons
                  name="public"
                  size={24}
                  color={selIsonline ? (isDarkMode ? "#fff" : "#4CAF50") : isDarkMode ? "#bbb" : "#555"}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* فیلد متن و دکمه ارسال */}
          <View style={styles.textInputWrapper}>
            <TextInput
              style={[
                styles.textInput,
                isDarkMode ? styles.darkTextInput : styles.lightTextInput,
                { textAlign: isPersian(inputUser) ? "right" : "left" },
              ]}
              value={inputUser}
              onChangeText={setInputUser}
              multiline
              placeholder="پیام خود را بنویسید..."
              placeholderTextColor={isDarkMode ? "#aaa" : "#666"}
            />
            <View style={styles.inputButtons}>
              {selectedLLM.accept_file === 1 && (
                <Tooltip text="تصویر / فایل"  position="left">
                  <TouchableOpacity onPress={toggleFilePickerModal} style={styles.uploadButton}>
                    <MaterialIcons name="image" size={24} color={isDarkMode ? "#fff" : "#000"} />
                  </TouchableOpacity>
                </Tooltip>
              )}
              <TouchableOpacity onPress={handleSubmit} style={styles.sendButton}>
                <MaterialIcons name="send" size={24} color={isDarkMode ? "#fff" : "#000"} />
              </TouchableOpacity>
            </View>
          </View>

          {/* نمونه‌ها */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.samplesContainer}>
            {renderSample()}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

<Modal
  visible={isFilePickerModalOpen}
  animationType="slide"
  transparent={true}
  onRequestClose={toggleFilePickerModal}
  hardwareAccelerated={true}
  
>
  <TouchableOpacity
    style={styles.modalOverlayFilePicker}
    onPress={toggleFilePickerModal}
    activeOpacity={1}
    transparent
  >
    <View style={styles.modalContentFilePicker}>
      <View style={styles.modalFilePicker}>
        

        <TouchableOpacity
        
          // onPress={async () => {
          //   const [{ uri: targetUri }] = await saveDocuments({
          //     sourceUris: ['some file uri'],
          //     copy: false,
          //     mimeType: 'text/plain',
          //     fileName: 'some file name',
          //   })
          // }}

          // onPress={() => {
          //   const uriToOpen = 'file:///path/to/your/file'
          //   viewDocument({ uri: uriToOpen, mimeType: 'some-mime' }).catch(handleError)
          // }}
          onPress={() => {
            pick({
              allowMultiSelection: true,
              type: [types.allFiles],
              // [types.pdf, types.docx],
            })
              .then((res) => {
                const allFilesArePdfOrDocx = res.every((file) => file.hasRequestedType)
                if (!allFilesArePdfOrDocx) {
                  console.log()
                  // tell the user they selected a file that is not a pdf or docx
                }else{
                  console.log("file picker ", res[0].uri)
                  setSelectedImage(res[0].uri)
                  setImagePreview(res[0].uri)
                  
                }

                // addResult(res)
              })
              .catch()
          }}
        
          style={styles.iconContainer}
          activeOpacity={0.7}
        >
          <MaterialIcons name="insert-drive-file" size={50} color="#000" />
          <Text style={styles.iconText}>فایل</Text>
        </TouchableOpacity>

        {/* دوربین */}
        <TouchableOpacity
          onPress={() => {
            launchCamera({
              mediaType: 'photo',
              quality: 0.8,
              cameraType: 'back',
            }, (response) => {
              if (response.didCancel) {
                console.log('User cancelled camera picker');
              } else if (response.errorCode) {
                Alert.alert('Error', response.errorMessage);
              } else if (response.assets && response.assets[0]) {
                const source = { uri: response.assets[0].uri };
                // پردازش عکس گرفته شده
                setSelectedImage(source)
                setImagePreview(response.assets[0].uri)
                console.log('Camera image:', source);
              }
            });
            toggleFilePickerModal(); // بستن مودال پس از انتخاب
          }}
          style={styles.iconContainer}
          activeOpacity={0.7}
        >
          <MaterialIcons name="camera-alt" size={50} color="#000" />
          <Text style={styles.iconText}>دوربین</Text>
        </TouchableOpacity>

        {/* گالری */}
        <TouchableOpacity
          
          onPress={() => {
            launchImageLibrary({
              mediaType: '',
              quality: 0.8,
              selectionLimit: 1, // انتخاب حداکثر یک عکس
            }, (response) => {
              if (response.didCancel) {
                console.log('User cancelled image picker');
              } else if (response.errorCode) {
                Alert.alert('Error', response.errorMessage);
              } else if (response.assets && response.assets[0]) {
                const source = { uri: response.assets[0].uri };
                // پردازش عکس انتخاب شده
                setSelectedImage(source)
                setImagePreview(response.assets[0].uri)
                console.log('Gallery image:', source);
              }
            });
            toggleFilePickerModal(); // بستن مودال پس از انتخاب
          }}
          style={styles.iconContainer}
          activeOpacity={0.7}
        >
          <MaterialIcons name="photo-library" size={50} color="#000" />
          <Text style={styles.iconText}>گالری</Text>
        </TouchableOpacity>

      </View>
      
      {/* دکمه لغو */}
      <TouchableOpacity
        onPress={toggleFilePickerModal}
        style={styles.cancelButton}
        activeOpacity={0.7}
      >
        <Text style={styles.cancelButtonText}>لغو</Text>
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
</Modal>


      {/* مودال انتخاب مدل */}
<Modal
  visible={isModalOpen}
  animationType="fade"
   
  transparent={true}
  onRequestClose={toggleModal}
  hardwareAccelerated={true} // برای اندروید
>
  <TouchableOpacity 
    style={styles.modalOverlay} 
    onPress={toggleModal} 
    activeOpacity={1}
  >
    <View style={styles.modalContent}>
      {/* 1. FlatList جایگزین ScrollView برای لیست بزرگ */}
      <FlatList
        data={ModelPageData?.llms}
        keyExtractor={(item) => item.id.toString()}
        numColumns={3} // برای شبکه‌ای نمایش
        columnWrapperStyle={styles.llmGrid}
        initialNumToRender={10}
        renderItem={({ item, index }) => (
        
          <TouchableOpacity 
            key={item.id} 
            onPress={() => selectLLM(item)} 
            style={styles.llmItem}
            activeOpacity={0.7}
            transparent
          >
            {/* 2. کش تصاویر SVG با کتابخانه بهینه */}
            {/* <FastImage
              style={styles.llmIcon}
              source={{ uri: item.img_url }}
              resizeMode={FastImage.resizeMode.contain}
            /> */}
           
            <View style={styles.svgContainer} >
                {/* <SvgUri
                width="100%"
                // height="100%"
            
                uri={item.img_url || selectedLLM.img_url}/> */}
                 <MenuItemIcon uri={item.img_url} index={index} />
              </View>
            <Text 
              style={styles.llmTitle}
              numberOfLines={2} // جلوگیری از خطوط زیاد
            >
              {item.title}
            </Text>
            
            {item.is_lock === 1 && (
              <Icon 
                name="lock-closed" 
                size={16} 
                color="#888" 
              />
            )}
          </TouchableOpacity>
        )}
        // initialNumToRender={12} // رندر اولیه کم
        maxToRenderPerBatch={6} // بچ رندر
        windowSize={5} // کاهش window size
        removeClippedSubviews={true} // حذف ویو‌های غیرمرئی
        ListFooterComponent={<View style={{ height: 80 }} />} // فضای خالی برای دکمه بستن
      />

      {/* 3. دکمه خارج از اسکرول */}
      <TouchableOpacity 
        onPress={toggleModal} 
        style={styles.closeModalButton}
        activeOpacity={0.8}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // افزایش ناحیه تپ
      >
        <Icon name="close" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
</Modal>

      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  historySidemenu:{
    backgroundColor:"#000"
  },
    svgContainer: {
    width: 50,
    height: 50,
    backgroundColor: 'transparent', // یا رنگ مورد نظر
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: { flex: 1, },
  darkContainer: { backgroundColor: "#000" },
  lightContainer: { backgroundColor: "#f5f5f5" },
  sidebar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 250,
    padding: 10,
  },
  sidebarCollapsed: { width: 60 },
  darkSidebar: { backgroundColor: "#141414" },
  lightSidebar: { backgroundColor: "#e0e0e0" },
  sidebarToggle: { padding: 10, alignSelf: "flex-end" },
  sidebarHistory: { marginTop: 20 },
  historyParent:{flexShrink:1,height:'70%',marginTop:'60', borderTopColor:'#000', borderTopWidth:1, borderBottomWidth:1, paddingVertical:10},
  mainContent: { flex: 1, marginLeft: Platform.OS === "web" ? 250 : 0 },
  mainContentExpanded: { marginLeft: Platform.OS === "web" ? 60 : 0 },
  chatContainer: { flex: 1, paddingTop:40, paddingBottom:400,marginBottom:20, },
  chatContent: {flex:1, padding: 20, paddingBottom: 150 },
  bubbleWrapper: { alignItems: "center", marginVertical: 20 },
  messageContainer: {
    flexDirection: "row",
    marginVertical: 8,
    alignItems: "flex-end",
  },
  userMessage: { justifyContent: "flex-end" },
  botMessage: { justifyContent: "flex-start" },
  avatar: { width: 15, height: 15, borderRadius: 15, marginHorizontal: 8 },
  avatarImg: { width: 45, height: 45, borderRadius: 15, marginHorizontal: 8 },
  messageBubble: {
    maxWidth: "70%",
    padding: 12,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
  },
  userBubble: { backgroundColor: "#E5E5EA", borderBottomRightRadius: 4 },
  botBubble: { backgroundColor: "#E5E5EA", borderBottomLeftRadius: 4 },
  messageText: { color: "#000", fontSize: 16 },
  messageImage: { width: 200, height: 150, borderRadius: 10, marginBottom: 8 },
  timestamp: { fontSize: 10, color: "#666", marginTop: 4 },
  loadingContainer: { flexDirection: "row", alignItems: "center", padding: 10 },
  loadingText: { marginLeft: 10, color: "#666" },
  inputContainer: {
    // position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  imagePreviewContainer: {
    position: "absolute",
    bottom: 140,
    left: 10,
    backgroundColor: "rgba(5,67,99,0.9)",
    borderRadius: 8,
    padding: 8,
    maxWidth: 200,
  },
  previewImage: { width: 180, height: 120, borderRadius: 6 },
  removeImageButton: { position: "absolute", top: -10, left: -10 },
  creditText: { color: "#fff", textAlign: "center", marginTop: 5 },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    flexWrap: "wrap",
  },
  modelButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#054363",
    padding: 3,
    borderRadius: 8,
    flex: 2,
    marginHorizontal: 2,
  },
  modelIcon: { width: 10, height: 10, marginRight: 2 },
  modelButtonText: { color: "#fff", fontSize: 12 },
  actionButton: {
    backgroundColor: "#054363",
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 2,
    alignItems: "center",
  },
  actionButtonText: { color: "#fff", fontSize: 12,paddingTop:5 },
  iconButton: {
    backgroundColor: "#054363",
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  textInputWrapper: { flexDirection: "row-reverse", alignItems: "center" },
  textInput: {
    flex: 1,
    minHeight: 50,
    maxHeight: 150,
    borderRadius: 5,
    paddingHorizontal: 20,
    paddingRight: 100,
    fontSize: 16,
  },
  darkTextInput: { backgroundColor: "#054363", color: "#fff" },
  lightTextInput: { backgroundColor: "#ccc", color: "#000" },
  inputButtons: {
    position: "absolute",
    right: 10,
    flexDirection: "row",
  },
  uploadButton: { padding: 8 },
  sendButton: { padding: 8, borderLeftWidth: 1, borderLeftColor: "#aaa", marginLeft: 8 },
  samplesContainer: { marginTop: 10 },
  sampleButton: {
    backgroundColor: "#333",
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  sampleText: { color: "#fff", fontSize: 12 },
  modalFilePicker:{
   backgroundColor: "#054363",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "35%",
    marginTop:"30",
    paddingTop:"33"
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#054363",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "35%",
    marginTop:"30",
    paddingTop:"33"
  },
  modalScroll: { padding: 20 },
  llmGrid: { flexDirection: "row",  justifyContent:'center', paddingLeft:10, paddingRight:10,paddingTop:10 },
  llmItem: {
    width: "30%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 5,
    marginBottom: 2,
    marginRight:5,
    marginLeft:5,
    alignItems: "center",

  },
  llmIcon: { width: 40, height: 40, marginBottom: 5 },
  llmTitle: { fontSize: 12, textAlign: "center" },
  closeModalButton: { position: "absolute", top: 10, right: 10 },
  tooltipContainer: {
    position: "absolute",
    backgroundColor: "#333",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 1000,
  },
  tooltipText: { color: "#fff", fontSize: 12 },
  bubbleContainer: { paddingHorizontal: 10 },
  bubbleItem: { alignItems: "center", marginHorizontal: 10 },
  bubbleIcon: { width: 50, height: 50, borderRadius: 25 },
  bubbleText: { marginTop: 5, fontSize: 12 },
  historyItemContainer: { flexDirection: "row", alignItems: "center", marginHorizontal:20},
  historyButton: {
    flex: 1,
    backgroundColor: "#ccc",
    color:"#000",
    paddingHorizontal:5,
    paddingVertical:5,
    borderRadius: 3,
  },
  selectedHistoryButton: { backgroundColor: "#888", color:"#FFF" },
  historyText: { color: "#000" },
  deleteButton: { padding: 5 },
  sideMenuParent:{flex: 1, width:'100%', backgroundColor:'#000'},
  sideMenuContainer: { flex: 1, paddingTop: 50, width:'70%', direction:'rtl', backgroundColor:"#FFF" },
  filePicker:{flex:1, paddingTop:50, height:'20%'},
  darkBg: { backgroundColor: "#000" },
  lightBg: { backgroundColor: "#fff" },
  closeButton: { position: "absolute", top: 5, right: 20, zIndex: 10 },


 modalOverlayFilePicker: {
    flex: 1,
    // backgroundColor: '#ccc',
    justifyContent: 'flex-end',
    alignItems:'center'
  },
  modalContentFilePicker: {
    backgroundColor: '#f0f0f0',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
    width:"90%"
  },
  modalFilePicker: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  iconContainer: {
    alignItems: 'center',
    padding: 20,
  },
  iconText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 18,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '600',
  },



});

const markdownStyles = {
  body: { color: "#000" },
  code_inline: { backgroundColor: "#f0f0f0", padding: 2, borderRadius: 3 },
  code_block: { backgroundColor: "#1e1e1e", color: "#fff", padding: 10, borderRadius: 5 },
};