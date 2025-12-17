import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Modal,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
import { createMMKV } from 'react-native-mmkv';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';
import Config from 'react-native-config';
// import DateTimePicker from '@react-native-community/datetimepicker';
// import * as DocumentPicker from 'react-native-document-picker';
// import * as ImagePicker from 'react-native-image-picker';
import CheckBox from '@react-native-community/checkbox';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FeatherIcon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Markdown from 'react-native-markdown-display';
import { WebView } from 'react-native-webview';

// Initialize MMKV
const storage = new createMMKV();
const apiUrl = Config.API_URL;
const lngs = [
  'javascript',
  'typescript',
  'python',
  'java',
  'csharp',
  'go',
  'php',
  'html',
  'css',
  'json',
  'sql'
];

const DynamicForm = ({ ModelFormData, ModelPageData, ParentSideMenuState, ParenHandleSideBar }) => {
  const [formData, setFormData] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [captchaURL, setCaptchaURL] = useState(null);
  const [captchaID, setCaptchaID] = useState("");
  const [captchaRes, setCaptchaRes] = useState("");
  const [errors, setErrors] = useState({});
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [inputUser, setInputUser] = useState('');
  const [llmResponse, setLLMResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [isCodePage, setIsCodePage] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamDone, setStreamDone] = useState(false);
  const [history, setHistory] = useState([]);
  const [changePageLay, setChangePageLay] = useState(0);
  const [selectHistoryBtnKey, setSelectHistoryBtnKey] = useState(0);
  const [lng, setLng] = useState('javascript');
  const [code, setCode] = useState('');
  const [mobileHistoryMenu, setMobileHistoryMenu] = useState(false);
  const [viewMode, setViewMode] = useState('split');
  const [isLoadingBtn, setIsLoadingBtn] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState({});
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState('fa');

  const { width, height } = Dimensions.get('window');

  // Get token from MMKV
  const getToken = () => {
    return storage.getString('token') || '';
  };

  const getUid = () => {
    return storage.getString('uid') || '';
  };

  // SEO equivalent for React Native
  useEffect(() => {
    // Alert.alert("","in form base ")
    if (!ModelPageData) return;
    
    // For React Native, we can't set document.title, but we can update header or store in context
    if (ModelPageData?.pageInfo?.title) {
      // You might want to update your navigation header here
      // navigation.setOptions({ title: ModelPageData.pageInfo.title });
    }
  }, [ModelPageData]);

  useEffect(() => {
    setMobileHistoryMenu(ParentSideMenuState);
  }, [ParentSideMenuState]);

  const handleRemoveFile = (fieldName) => {
    setFormValues(prev => ({
      ...prev,
      [fieldName]: null
    }));
    
    setSelectedFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[fieldName];
      return newFiles;
    });
  };

  const fetchFormData = async () => {
    console.log("model page data page id", ModelPageData['page_id']);
    const response = ModelFormData;
    console.log("Form data:", response);
    
    setFormData(response);
    const initialValues = {};
    
    if (response?.fields) {
      response.fields.forEach(field => {
        if (field.field === 'checkbox' && field.settings) {
          initialValues[field.name] = [];
        } else {
          initialValues[field.name] = '';
        }
      });
    }
    
    setFormValues(initialValues);
    
    setTimeout(() => {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }, 1500);
  };

  useEffect(() => {
    fetchFormData();
  }, [ModelFormData]);

  const handleCopy = async (text) => {
    try {
      // For React Native, you might want to use Clipboard API
      // import Clipboard from '@react-native-clipboard/clipboard';
      // Clipboard.setString(text);
      
      Alert.alert('کپی شد', 'متن با موفقیت کپی شد');
    } catch (err) {
      console.error('Failed to copy text: ', err);
      Alert.alert('خطا', 'خطا در کپی کردن متن');
    }
  };

  const fetchHistory = async () => {
    try {
      const token = getToken();
      const response = await axios.get(
        `${process.env.API_BASE_URL}/models/${formData?.form_slug}/?lang=${language}&style=dark&history_limit=25`,
        {
          headers: {
            Authorization: token,
            'Content-Type': 'application/json'
          },
        }
      );
      
      if (response?.data?.data?.history) {
        setHistory(response.data.data.history);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  useEffect(() => {
    if (formData?.form_slug) {
      fetchHistory();
    }
  }, [formData]);

  const handleCaptcha = async () => {
    setCaptchaRes("");
    try {
      const resp = await axios.get(
        `${process.env.API_BASE_URL}/recapcha/?lang=${language}`
      );
      setCaptchaURL(resp.data.data.url);
      setCaptchaID(resp.data.data.cid);
    } catch (err) {
      Alert.alert('خطا', 'خطا در دریافت کد کپچا');
    }
  };

  const handleChange = (fieldName, value, fieldType = 'text') => {
    if (fieldType === 'checkbox') {
      setFormValues(prev => {
        const currentValues = prev[fieldName] || [];
        if (currentValues.includes(value)) {
          return {
            ...prev,
            [fieldName]: currentValues.filter(v => v !== value)
          };
        } else {
          return {
            ...prev,
            [fieldName]: [...currentValues, value]
          };
        }
      });
    } else {
      setFormValues(prev => ({
        ...prev,
        [fieldName]: value
      }));
    }

    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: ''
      }));
    }
  };

  const handleFilePick = async (fieldName) => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
      });
      
      setFormValues(prev => ({
        ...prev,
        [fieldName]: result
      }));
      
      setSelectedFiles(prev => ({
        ...prev,
        [fieldName]: result.name
      }));
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        // User cancelled the picker
      } else {
        throw err;
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    if (formData?.fields) {
      formData.fields.forEach(field => {
        if (field.is_req && !formValues[field.name]) {
          newErrors[field.name] = field.error_msg || 'این فیلد الزامی است';
          isValid = false;
        }
      });
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleStreamReader = async (responseData) => {
    if (!responseData) return;
    
    setIsLoading(true);
    setIsStreaming(true);
    
    try {
      const { stream_url, task_id, "chat-id": chatID, uid, "page-id": pageID } = responseData;
      storage.set('free_chat_id', chatID);
      console.log("test fetch")
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
      console.log("response " , response)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      // const reader = response.body.getReader();
      // const decoder = new TextDecoder('utf-8');
      // let accumulatedText = '';
      console.log(responseText)
      setLLMResponse(responseText);
      // while (true) {
      //   const { done, value } = await reader.read();
      //   if (done) {
      //     setStreamDone(true);
      //     break;
      //   }

      //   // const chunk = decoder.decode(value);
      //   // accumulatedText += chunk;
      //   setLLMResponse(responseText);
      // }
    } catch (error) {
      console.log('Error in stream reading:', error.response)
      // Alert.alert('خطا', 'خطا در خواندن پاسخ');
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setIsLoadingBtn(false);
    }
  };

  const handleSubmit = async () => {
    if (isLoadingBtn) return;
    
    setIsSubmitting(true);
    setSubmitStatus(false);
    setIsLoadingBtn(true);
    
    if (!validateForm()) {
      setIsLoadingBtn(false);
      setIsSubmitting(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      
      if (formData?.fields) {
        formData.fields.forEach(field => {
          if (field.name === "chat-ai") {
            const combinedValue = code ? `${inputUser}\n\nCode:\n${code}` : inputUser;
            formDataToSend.append("chat-ai", combinedValue);
            if (code) setIsCodePage(true);
          } else if (field.name !== "code") {
            const value = formValues[field.name] ?? field.settings?.value ?? '';
            formDataToSend.append(field.name, value);
          }
        });
      }

      if (formData?.have_capcha) {
        formDataToSend.append("cid", captchaID);
        formDataToSend.append("cres", captchaRes);
      }

      formDataToSend.append("page-id", ModelPageData.page_id);
      formDataToSend.append("id", 0);
      console.log("form url" , `${formData?.sub_url || ''}${formData?.form_slug}/?lang=${language}&style=dark`);
      console.log("form data->", formDataToSend)
      const token = getToken();
      const response = await axios({
        method: formData?.form_method || 'POST',
        url: `${formData?.sub_url || ''}${formData?.form_slug}/?lang=${language}&style=dark`,
        data: formDataToSend,
        headers: {
          Authorization: `${token}`,
          ...(token ? { Authorization: `${token}` } : {}),
          Referer: 'https://test.irani-ai.com/', // 
          Host:"api2.irani-ai.com",
          "Content-Type": "multipart/form-data",
        },
      });

      if (response?.data?.data) {
        const dt = {
          uid: getUid(),
          stream_url: response.data.data.stream_url,
          task_id: response.data.data.task_id,
          "page-id": ModelPageData['page_id'],
          "chat-id": response.data.data['chat-id'],
        };
        console.log("handle submit dt" , dt)
        
        await handleStreamReader(dt);
      }

      const resetValues = {};
      if (formData?.fields) {
        formData.fields.forEach(field => {
          resetValues[field.name] = "";
        });
      }
      
      setFormValues(resetValues);
      setInputUser("");
      fetchHistory();
      
    } catch (error) {
      setIsLoadingBtn(false);
      console.log("err in submit", error.response)
      Alert.alert('خطا', error.response?.data?.message || 'خطا در ارسال فرم');
      setSubmitStatus("error");
      
      if (error.response?.data) {
        setErrors(error.response.data);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSideBarHistory = () => {
    if (!history || Object.keys(history).length === 0) {
      return (
        <Text style={[styles.historyEmptyText, isDarkMode && styles.darkText]}>
          تاریخچه‌ای موجود نیست
        </Text>
      );
    }

    return Object.keys(history).map((key) => {
      const historyItem = history[key];
      const conversation = historyItem?.conversation || {};
      
      return Object.keys(conversation).map((key2) => {
        const message = conversation[key2];
        
        if (message?.role === "user" && key2 === "0") {
          return (
            <View key={`${key}-${key2}`} style={styles.historyItem}>
              <TouchableOpacity
                onPress={() => showHistory(conversation, key, historyItem.id)}
                style={[styles.historyButton, key == selectHistoryBtnKey && styles.historyButtonSelected]}
              >
                <Text 
                  style={[styles.historyText, isDarkMode && styles.darkText]}
                  numberOfLines={2}
                >
                  {message.content || ''}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => delete_history(historyItem.id)}
                style={styles.deleteButton}
              >
                <Icon name="delete" size={24} color={isDarkMode ? '#ff6b6b' : '#ff4444'} />
              </TouchableOpacity>
            </View>
          );
        }
        return null;
      });
    });
  };

  const delete_history = async (id) => {
    ParenHandleSideBar();
    
    try {
      const token = getToken();
      const response = await axios.post(
        `${process.env.API_BASE_URL}/response/deletechathistory/`,
        { chat_id: id },
        { headers: { Authorization: token } }
      );
      
      if (response) {
        fetchHistory();
        Alert.alert('موفق', 'تاریخچه با موفقیت حذف شد');
      }
    } catch (err) {
      console.error('Error deleting history:', err);
      Alert.alert('خطا', 'خطا در حذف تاریخچه');
    }
  };

  const showHistory = (conversation, key, historyId) => {
    if (!conversation || Object.keys(conversation).length < 2) return;
    
    // Set LLM response
    if (conversation[1]?.content) {
      setLLMResponse(conversation[1].content);
    }
    
    // Fill form values
    const newFormValues = { ...formValues };
    const newErrors = { ...errors };
    
    if (conversation[0]?.formData) {
      Object.keys(conversation[0].formData).forEach((fieldName) => {
        newFormValues[fieldName] = conversation[0].formData[fieldName];
        
        if (conversation[0].formData[fieldName]) {
          newErrors[fieldName] = '';
        }
        
        if (fieldName === "chat-ai") {
          setInputUser(conversation[0].formData[fieldName]);
        }
      });
    }
    
    setFormValues(newFormValues);
    setErrors(newErrors);
  };

  const renderField = (field, have_capcha) => {
    if (!field) return null;

    const fieldStyle = [
      styles.input,
      isDarkMode && styles.darkInput,
      errors[field.name] && styles.inputError
    ];

    switch (field.field) {
      case 'input':
        switch (field.field_type) {
          case 'text':
          case 'email':
          case 'number':
          case 'password':
          case 'tel':
          case 'url':
            return (
              <View key={field.name} style={styles.fieldContainer}>
                <Text style={[styles.label, isDarkMode && styles.darkText]}>
                  {field.label}
                  {field.is_req === 1 && <Text style={styles.required}> *</Text>}
                </Text>
                <TextInput
                  style={fieldStyle}
                  value={formValues[field.name] || ''}
                  onChangeText={(text) => handleChange(field.name, text)}
                  placeholder={field.placeholder || ''}
                  placeholderTextColor={isDarkMode ? '#999' : '#666'}
                  keyboardType={
                    field.field_type === 'email' ? 'email-address' :
                    field.field_type === 'number' ? 'numeric' :
                    field.field_type === 'tel' ? 'phone-pad' :
                    'default'
                  }
                  secureTextEntry={field.field_type === 'password'}
                  multiline={field.field_type === 'textarea'}
                />
                {errors[field.name] && (
                  <Text style={styles.errorText}>{errors[field.name]}</Text>
                )}
              </View>
            );

          case 'file':
            return (
              <View key={field.name} style={styles.fieldContainer}>
                <Text style={[styles.label, isDarkMode && styles.darkText]}>
                  {field.label}
                  {field.is_req === 1 && <Text style={styles.required}> *</Text>}
                </Text>
                
                <TouchableOpacity
                  style={[styles.fileButton, isDarkMode && styles.darkFileButton]}
                  onPress={() => handleFilePick(field.name)}
                >
                  <Icon name="attach-file" size={24} color={isDarkMode ? '#fff' : '#333'} />
                  <Text style={[styles.fileButtonText, isDarkMode && styles.darkText]}>
                    {selectedFiles[field.name] || 'انتخاب فایل'}
                  </Text>
                </TouchableOpacity>
                
                {selectedFiles[field.name] && (
                  <TouchableOpacity
                    style={styles.removeFileButton}
                    onPress={() => handleRemoveFile(field.name)}
                  >
                    <Icon name="close" size={20} color="#ff4444" />
                    <Text style={styles.removeFileText}>حذف فایل</Text>
                  </TouchableOpacity>
                )}
                
                {errors[field.name] && (
                  <Text style={styles.errorText}>{errors[field.name]}</Text>
                )}
              </View>
            );

          case 'radio':
            return (
              <View key={field.name} style={styles.fieldContainer}>
                <Text style={[styles.label, isDarkMode && styles.darkText]}>
                  {field.label}
                  {field.is_req === 1 && <Text style={styles.required}> *</Text>}
                </Text>
                
                {field.settings?.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.radioOption}
                    onPress={() => handleChange(field.name, option.value)}
                  >
                    <View style={styles.radioCircle}>
                      {formValues[field.name] === option.value && (
                        <View style={styles.radioSelected} />
                      )}
                    </View>
                    <Text style={[styles.radioText, isDarkMode && styles.darkText]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
                
                {errors[field.name] && (
                  <Text style={styles.errorText}>{errors[field.name]}</Text>
                )}
              </View>
            );

          case 'checkbox':
            if (field.settings) {
              return (
                <View key={field.name} style={styles.fieldContainer}>
                  <Text style={[styles.label, isDarkMode && styles.darkText]}>
                    {field.label}
                    {field.is_req === 1 && <Text style={styles.required}> *</Text>}
                  </Text>
                  
                  {field.settings.map((option) => (
                    <View key={option.value} style={styles.checkboxOption}>
                      <CheckBox
                        value={(formValues[field.name] || []).includes(option.value)}
                        onValueChange={() => handleChange(field.name, option.value, 'checkbox')}
                        tintColors={{
                          true: isDarkMode ? '#4dabf7' : '#1976d2',
                          false: isDarkMode ? '#666' : '#999'
                        }}
                      />
                      <Text style={[styles.checkboxText, isDarkMode && styles.darkText]}>
                        {option.label}
                      </Text>
                    </View>
                  ))}
                  
                  {errors[field.name] && (
                    <Text style={styles.errorText}>{errors[field.name]}</Text>
                  )}
                </View>
              );
            } else {
              return (
                <View key={field.name} style={styles.fieldContainer}>
                  <View style={styles.checkboxOption}>
                    <CheckBox
                      value={formValues[field.name] || false}
                      onValueChange={(value) => handleChange(field.name, value)}
                      tintColors={{
                        true: isDarkMode ? '#4dabf7' : '#1976d2',
                        false: isDarkMode ? '#666' : '#999'
                      }}
                    />
                    <Text style={[styles.checkboxText, isDarkMode && styles.darkText]}>
                      {field.label}
                    </Text>
                  </View>
                </View>
              );
            }

          case 'range':
            return (
              <View key={field.name} style={styles.fieldContainer}>
                <Text style={[styles.label, isDarkMode && styles.darkText]}>
                  {field.label}: {formValues[field.name] || field.settings?.min || 0}
                  {field.is_req === 1 && <Text style={styles.required}> *</Text>}
                </Text>
                
                <Slider
                  style={styles.slider}
                  minimumValue={field.settings?.min || 0}
                  maximumValue={field.settings?.max || 100}
                  step={field.settings?.step || 1}
                  value={formValues[field.name] || field.settings?.min || 0}
                  onValueChange={(value) => handleChange(field.name, value)}
                  minimumTrackTintColor={isDarkMode ? '#4dabf7' : '#1976d2'}
                  maximumTrackTintColor={isDarkMode ? '#444' : '#ddd'}
                />
                
                {errors[field.name] && (
                  <Text style={styles.errorText}>{errors[field.name]}</Text>
                )}
              </View>
            );

          case 'date':
            return (
              <View key={field.name} style={styles.fieldContainer}>
                <Text style={[styles.label, isDarkMode && styles.darkText]}>
                  {field.label}
                  {field.is_req === 1 && <Text style={styles.required}> *</Text>}
                </Text>
                
                <TouchableOpacity
                  style={fieldStyle}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={[styles.dateText, isDarkMode && styles.darkText]}>
                    {formValues[field.name] || 'انتخاب تاریخ'}
                  </Text>
                </TouchableOpacity>
                
                {showDatePicker && (
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                      setShowDatePicker(false);
                      if (date) {
                        setSelectedDate(date);
                        handleChange(field.name, date.toISOString().split('T')[0]);
                      }
                    }}
                  />
                )}
                
                {errors[field.name] && (
                  <Text style={styles.errorText}>{errors[field.name]}</Text>
                )}
              </View>
            );

          case 'datetime-local':
            return (
              <View key={field.name} style={styles.fieldContainer}>
                <Text style={[styles.label, isDarkMode && styles.darkText]}>
                  {field.label}
                  {field.is_req === 1 && <Text style={styles.required}> *</Text>}
                </Text>
                
                <TouchableOpacity
                  style={fieldStyle}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={[styles.dateText, isDarkMode && styles.darkText]}>
                    {formValues[field.name] || 'انتخاب تاریخ و زمان'}
                  </Text>
                </TouchableOpacity>
                
                {showTimePicker && (
                  <DateTimePicker
                    value={selectedDate}
                    mode="datetime"
                    display="default"
                    onChange={(event, date) => {
                      setShowTimePicker(false);
                      if (date) {
                        setSelectedDate(date);
                        handleChange(field.name, date.toISOString());
                      }
                    }}
                  />
                )}
                
                {errors[field.name] && (
                  <Text style={styles.errorText}>{errors[field.name]}</Text>
                )}
              </View>
            );

          case 'time':
            return (
              <View key={field.name} style={styles.fieldContainer}>
                <Text style={[styles.label, isDarkMode && styles.darkText]}>
                  {field.label}
                  {field.is_req === 1 && <Text style={styles.required}> *</Text>}
                </Text>
                
                <TouchableOpacity
                  style={fieldStyle}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={[styles.dateText, isDarkMode && styles.darkText]}>
                    {formValues[field.name] || 'انتخاب زمان'}
                  </Text>
                </TouchableOpacity>
                
                {showTimePicker && (
                  <DateTimePicker
                    value={selectedDate}
                    mode="time"
                    display="default"
                    onChange={(event, date) => {
                      setShowTimePicker(false);
                      if (date) {
                        setSelectedDate(date);
                        const timeStr = date.toTimeString().split(' ')[0];
                        handleChange(field.name, timeStr);
                      }
                    }}
                  />
                )}
                
                {errors[field.name] && (
                  <Text style={styles.errorText}>{errors[field.name]}</Text>
                )}
              </View>
            );

          case 'submit':
            return (
              <View key={field.name} style={styles.fieldContainer}>
                {have_capcha && (
                  <>
                    <View style={styles.captchaContainer}>
                      {captchaURL && (
                        <Image
                          source={{ uri: captchaURL }}
                          style={styles.captchaImage}
                          resizeMode="contain"
                        />
                      )}
                      <TouchableOpacity onPress={handleCaptcha} style={styles.refreshCaptcha}>
                        <Icon name="refresh" size={24} color={isDarkMode ? '#fff' : '#333'} />
                      </TouchableOpacity>
                    </View>
                    
                    <TextInput
                      style={fieldStyle}
                      value={captchaRes}
                      onChangeText={setCaptchaRes}
                      placeholder="حاصل تصویر بالا"
                      placeholderTextColor={isDarkMode ? '#999' : '#666'}
                    />
                  </>
                )}
                
                <TouchableOpacity
                  style={[styles.submitButton, isLoadingBtn && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={isLoadingBtn}
                >
                  {isLoadingBtn ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>{field.label}</Text>
                  )}
                </TouchableOpacity>
              </View>
            );

          default:
            return null;
        }

      case 'select':
        return (
          <View key={field.name} style={styles.fieldContainer}>
            <Text style={[styles.label, isDarkMode && styles.darkText]}>
              {field.label}
              {field.is_req === 1 && <Text style={styles.required}> *</Text>}
            </Text>
            
            <View style={fieldStyle}>
              <Picker
                selectedValue={formValues[field.name] || ''}
                onValueChange={(value) => handleChange(field.name, value)}
                style={[styles.picker, isDarkMode && styles.darkPicker]}
                dropdownIconColor={isDarkMode ? '#fff' : '#333'}
              >
                <Picker.Item label="انتخاب کنید..." value="" />
                {field.settings?.map((option) => (
                  <Picker.Item
                    key={option.value}
                    label={option.label}
                    value={option.value}
                  />
                ))}
              </Picker>
            </View>
            
            {errors[field.name] && (
              <Text style={styles.errorText}>{errors[field.name]}</Text>
            )}
          </View>
        );

      case 'textarea':
        if (field.name === "code") {
          return (
            <View key={field.name} style={styles.codeContainer}>
              <Picker
                selectedValue={lng}
                onValueChange={setLng}
                style={[styles.languagePicker, isDarkMode && styles.darkPicker]}
              >
                {lngs.map((lang) => (
                  <Picker.Item key={lang} label={lang} value={lang} />
                ))}
              </Picker>
              
              <TextInput
                style={[styles.codeInput, isDarkMode && styles.darkCodeInput]}
                value={code}
                onChangeText={setCode}
                placeholder="کد خود را اینجا بنویسید..."
                placeholderTextColor={isDarkMode ? '#999' : '#666'}
                multiline
                textAlignVertical="top"
              />
            </View>
          );
        } else if (field.name !== "chat-ai") {
          return (
            <View key={field.name} style={styles.fieldContainer}>
              <Text style={[styles.label, isDarkMode && styles.darkText]}>
                {field.label}
                {field.is_req === 1 && <Text style={styles.required}> *</Text>}
              </Text>
              
              <TextInput
                style={[styles.textArea, isDarkMode && styles.darkInput]}
                value={formValues[field.name] || ''}
                onChangeText={(text) => handleChange(field.name, text)}
                placeholder={field.placeholder || ''}
                placeholderTextColor={isDarkMode ? '#999' : '#666'}
                multiline
                numberOfLines={field.settings?.rows || 4}
                textAlignVertical="top"
              />
              
              {errors[field.name] && (
                <Text style={styles.errorText}>{errors[field.name]}</Text>
              )}
            </View>
          );
        }
        return null;

      default:
        return null;
    }
  };

  const renderSamplesBtn = () => {
    if (ModelPageData?.pageInfo?.samples) {
      const sampleItems = Object.values(ModelPageData.pageInfo.samples);
      
      return sampleItems.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.sampleButton, isDarkMode && styles.darkSampleButton]}
          onPress={() => renderSamples(item)}
        >
          <Text style={[styles.sampleButtonText, isDarkMode && styles.darkText]}>
            {item.title}
          </Text>
        </TouchableOpacity>
      ));
    }
    return null;
  };

  const renderSamples = (cn) => {
    if (!cn?.conversation) return;
    
    if (cn.conversation[1]?.content) {
      setLLMResponse(cn.conversation[1].content);
    }
    
    const newFormValues = { ...formValues };
    const newErrors = { ...errors };
    
    if (cn.conversation[0]?.formData) {
      Object.keys(cn.conversation[0].formData).forEach((fieldName) => {
        newFormValues[fieldName] = cn.conversation[0].formData[fieldName];
        
        if (cn.conversation[0].formData[fieldName]) {
          newErrors[fieldName] = '';
        }
        
        if (fieldName === "chat-ai") {
          setInputUser(cn.conversation[0].formData[fieldName]);
        }
      });
    }
    
    setFormValues(newFormValues);
    setErrors(newErrors);
  };

  const renderResponseView = () => {
    if (!llmResponse) return null;

    if (ModelFormData?.form_slug === "web-builder-llm") {
      return (
        <View style={styles.webBuilderContainer}>
          <View style={styles.viewModeButtons}>
            <TouchableOpacity
              style={[styles.viewModeButton, viewMode === 'split' && styles.viewModeButtonActive]}
              onPress={() => setViewMode('split')}
            >
              <Text style={styles.viewModeButtonText}>تقسیم شده</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.viewModeButton, viewMode === 'preview' && styles.viewModeButtonActive]}
              onPress={() => setViewMode('preview')}
            >
              <Text style={styles.viewModeButtonText}>پیش‌نمایش</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.viewModeButton, viewMode === 'code' && styles.viewModeButtonActive]}
              onPress={() => setViewMode('code')}
            >
              <Text style={styles.viewModeButtonText}>کد</Text>
            </TouchableOpacity>
          </View>
          
          {(viewMode === 'split' || viewMode === 'code') && (
            <View style={styles.codeView}>
              <View style={styles.codeHeader}>
                <Text style={styles.codeHeaderText}>کد HTML</Text>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={() => handleCopy(llmResponse)}
                >
                  <Text style={styles.copyButtonText}>کپی کد</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.codeScrollView}>
                <Markdown style={markdownStyles}>
                  {llmResponse}
                </Markdown>
              </ScrollView>
            </View>
          )}
          
          {(viewMode === 'split' || viewMode === 'preview') && (
            <View style={styles.previewView}>
              <View style={styles.previewHeader}>
                <Text style={styles.previewHeaderText}>پیش‌نمایش</Text>
              </View>
              
              <WebView
                originWhitelist={['*']}
                source={{ html: `
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <meta name="viewport" content="width=device-width, initial-scale=1">
                      <style>
                        body { margin: 0; padding: 16px; font-family: Tahoma, Arial, sans-serif; }
                        * { box-sizing: border-box; }
                      </style>
                    </head>
                    <body>${llmResponse}</body>
                  </html>
                `}}
                style={styles.webView}
              />
            </View>
          )}
        </View>
      );
    } else {
      return (
        <ScrollView style={styles.responseContainer}>
          <Markdown style={markdownStyles}>
            {llmResponse}
          </Markdown>
          
          <TouchableOpacity
            style={styles.copyButtonLarge}
            onPress={() => handleCopy(llmResponse)}
          >
            <Icon name="content-copy" size={20} color="#fff" />
            <Text style={styles.copyButtonLargeText}>کپی پاسخ</Text>
          </TouchableOpacity>
        </ScrollView>
      );
    }
  };

  if (!formData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={styles.loadingText}>در حال بارگذاری فرم...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView style={styles.scrollView}>
          {/* Header */}
          {ModelPageData?.pageInfo?.title && (
            <Text style={[styles.pageTitle, isDarkMode && styles.darkText]}>
              {ModelPageData.pageInfo.title}
            </Text>
          )}
          
          {formData?.description && (
            <Text style={[styles.description, isDarkMode && styles.darkText]}>
              {formData.description}
            </Text>
          )}
          
          {/* Response Area */}
          {llmResponse && renderResponseView()}
          
          {/* Form */}
          {formData?.fields && (
            <View  style={styles.formContainer}>
              {formData.fields.map((field) => renderField(field, formData.have_capcha))}
            </View>
          )}
          
          {/* Chat Input */}
          <View style={styles.chatInputContainer}>
            <TextInput
              style={[styles.chatInput, isDarkMode && styles.darkChatInput]}
              value={inputUser}
              onChangeText={setInputUser}
              placeholder="پیام خود را بنویسید..."
              placeholderTextColor={isDarkMode ? '#999' : '#666'}
              multiline
            />
            
            <TouchableOpacity
              style={[styles.sendButton, isLoadingBtn && styles.sendButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoadingBtn}
            >
              {isLoadingBtn ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Icon name="send" size={24} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
          
          {/* Samples */}
          <View style={styles.samplesContainer}>
            {renderSamplesBtn()}
          </View>
          
          {/* Page Content */}
          {ModelPageData?.pageInfo?.content && (
            <View style={styles.contentContainer}>
            {/* <WebView
                originWhitelist={['*']}
                source={{ html: ModelPageData.pageInfo.content }}
            /> */}

              <WebView
                originWhitelist={['*']}
                source={{ html: `
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <meta name="viewport" content="width=device-width, initial-scale=1">
                      <style>
                        body { margin: 0; padding: 16px; font-family: Tahoma, Arial, sans-serif; }
                        * { box-sizing: border-box; }
                      </style>
                    </head>
                    <body dir="rtl">${ModelPageData.pageInfo.content}</body>
                  </html>
                `}}
                style={styles.webView}
              />



              {/* <Text style={[styles.contentText, isDarkMode && styles.darkText]}>

                {ModelPageData.pageInfo.content}
              </Text> */}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
    marginTop:30
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
    lineHeight: 24,
  },
  formContainer: {
    marginBottom: 24,
    textAlign:'right'
  },
fieldContainer: {
  marginBottom: 16,
  textAlign:'right',
  marginLeft: 'auto', // این آیتم را به راست می‌برد
  width:'100%',
  alignSelf: 'flex-end', // اگر parent flex باشد
  // width: 'auto', // عرض بر اساس محتوا
  
},
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
    textAlign:'right'
  },
  darkText: {
    color: '#fff',
  },
  required: {
    color: '#ff4444',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
  },
  darkInput: {
    backgroundColor: '#333',
    borderColor: '#444',
    color: '#fff',
  },
  inputError: {
    borderColor: '#ff4444',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
  },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
  },
  darkFileButton: {
    backgroundColor: '#333',
    borderColor: '#444',
  },
  fileButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  removeFileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  removeFileText: {
    color: '#ff4444',
    marginLeft: 4,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#1976d2',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1976d2',
  },
  radioText: {
    fontSize: 16,
    color: '#333',
  },
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkboxText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  captchaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  captchaImage: {
    width: 120,
    height: 50,
    borderRadius: 4,
  },
  refreshCaptcha: {
    marginLeft: 12,
  },
  submitButton: {
    backgroundColor: '#1976d2',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#999',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  picker: {
    width: '100%',
    color: '#333',
  },
  darkPicker: {
    color: '#fff',
  },
  codeContainer: {
    marginBottom: 24,
  },
  languagePicker: {
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  codeInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    minHeight: 200,
  },
  darkCodeInput: {
    backgroundColor: '#1e1e1e',
    borderColor: '#444',
    color: '#fff',
  },
  textArea: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    minHeight: 100,
  },
  webBuilderContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  viewModeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  viewModeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
  viewModeButtonActive: {
    backgroundColor: '#1976d2',
  },
  viewModeButtonText: {
    fontSize: 14,
    color: '#333',
  },
  codeView: {
    marginBottom: 16,
  },
  codeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  codeHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  codeScrollView: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    maxHeight: 300,
  },
  previewView: {
    marginBottom: 16,
  },
  previewHeader: {
    marginBottom: 8,
  },
  previewHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  webView: {
    width: '100%',
    height:'400',
    borderRadius: 8,
  },
  responseContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  copyButton: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  copyButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  copyButtonLarge: {
    backgroundColor: '#1976d2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  copyButtonLargeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    maxHeight: 120,
    minHeight: 50,
  },
  darkChatInput: {
    backgroundColor: '#333',
    borderColor: '#444',
    color: '#fff',
  },
  sendButton: {
    backgroundColor: '#1976d2',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#999',
  },
  samplesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 24,
  },
  sampleButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    margin: 4,
  },
  darkSampleButton: {
    backgroundColor: '#333',
    borderColor: '#444',
  },
  sampleButtonText: {
    fontSize: 14,
    color: '#333',
  },
  contentContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  historyButtonSelected: {
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#1976d2',
  },
  historyText: {
    fontSize: 14,
    color: '#333',
  },
  deleteButton: {
    padding: 8,
  },
  historyEmptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 16,
  },
});

const markdownStyles = {
  body: {
    color: '#333',
    fontSize: 16,
    lineHeight: 24,
  },
  heading1: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  heading2: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  paragraph: {
    marginTop: 8,
    marginBottom: 8,
  },
  link: {
    color: '#1976d2',
    textDecorationLine: 'underline',
  },
  code_inline: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: 'monospace',
  },
  code_block: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    fontFamily: 'monospace',
  },
  list_item: {
    marginLeft: 20,
  },
};

export default DynamicForm;