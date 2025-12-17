// components/DynamicFormWallet.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  Modal,
  ActivityIndicator,
  SafeAreaView,
  FlatList,
  Dimensions,
  Platform,
} from 'react-native';
import axios from 'axios';
import { createMMKV } from 'react-native-mmkv';
import * as ImagePicker from 'react-native-image-picker';
import { Picker } from '@react-native-picker/picker';
import CheckBox from '@react-native-community/checkbox';
import Slider from '@react-native-community/slider';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
// import DateTimePicker from '@react-native-community/datetimepicker';

// Icons
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AntDesign from 'react-native-vector-icons/AntDesign';

// Components
import History from './History';
// import SubmitBtn from './SubmitBtn';
// import LoadingButton from './LoadingBtn';
// import SideMenuMobile from './SideMenuMobile';
// import MenuTopMobile from './MenuTopMobile';

// Initialize MMKV
const storage = new createMMKV();

const DynamicFormWallet = ({ 
  ModelFormData, 
  ModelPageData, 
  ParentSideMenuState, 
  ParenHandleSideBar 
}) => {
  const [formData, setFormData] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [history, setHistory] = useState([]);
  const [dataOutput, setDataOutput] = useState({});
  const [walletApiSelected, setWalletApiSelected] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [improPromptLoading, setImproPromptLoading] = useState(0);
  const [showAllOptions, setShowAllOptions] = useState({});
  const [mobileHistoryMenu, setMobileHistoryMenu] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isWizard, setIsWizard] = useState(false);
  const [originTaskID, setOriginTaskID] = useState(null);
  
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);
  const imageRef = useRef(null);

  // Initialize
  useEffect(() => {
    checkLastTask();
    if (ModelPageData?.history) {
      setHistory(ModelPageData.history);
    }
    
    // Initialize wallet API selection
    if (ModelPageData?.wallet_apis?.length === 1) {
      setWalletApiSelected(ModelPageData.wallet_apis[0]);
    }
  }, []);

  // Check last task
  const checkLastTask = async () => {
    try {
      const token = storage.getString('token');
      const response = await axios({
        method: 'get',
        url: `${process.env.API_BASE_URL}/response/lasttask/`,
        headers: { Authorization: token },
      });
      
      if (response?.data?.data?.resID) {
        storage.set('model_task_sts', '3');
        storage.set('model_resID', response.data.data.resID);
        storage.set('model_taskID', response.data.data.taskID);
        getGpuTaskInterval();
      } else {
        storage.set('model_task_sts', '1');
      }
    } catch (error) {
      console.error('Error checking last task:', error);
      storage.set('model_task_sts', '1');
    }
  };

  // Fetch form data based on selected wallet API
  const fetchFormData = async () => {
    if (!walletApiSelected) return;
    
    try {
      const newSlug = `${ModelPageData.pageInfo.slug}-${walletApiSelected.id}`;
      const response = await axios.get(
        `${process.env.API_BASE_URL}/forms/?slug=${newSlug}&history_limit=25`
      );
      
      setFormData(response.data.data);
      
      // Initialize form values
      const initialValues = {};
      let cntFileInput = 0;
      
      response.data.data.fields.forEach(field => {
        if (field.field_type === 'file') {
          cntFileInput++;
        }
        if (field.name === 'origin_task_id') {
          initialValues[field.name] = originTaskID;
        } else if (field.field_type === 'checkbox' && field.settings) {
          initialValues[field.name] = [];
        } else {
          initialValues[field.name] = '';
        }
      });
      
      setFormValues(initialValues);
      
    } catch (error) {
      console.error('Error fetching form data:', error);
      Toast.show({
        type: 'error',
        text1: 'خطا',
        text2: 'بارگذاری فرم با مشکل مواجه شد',
      });
    }
  };

  useEffect(() => {
    if (walletApiSelected) {
      fetchFormData();
    }
  }, [walletApiSelected]);

  // Handle form changes
  const handleChange = (name, value) => {
    setFormValues(prev => ({
      ...prev,
      [name]: value,
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle checkbox changes
  const handleCheckboxChange = (name, value, checked) => {
    setFormValues(prev => {
      const currentValues = prev[name] || [];
      if (checked) {
        return { ...prev, [name]: [...currentValues, value] };
      } else {
        return { ...prev, [name]: currentValues.filter(v => v !== value) };
      }
    });
  };

  // Handle image picker
  const pickImage = async (fieldName) => {
    try {
      const result = await ImagePicker.launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });
      
      if (result.assets?.[0]) {
        const asset = result.assets[0];
        const fileData = {
          uri: asset.uri,
          type: asset.type,
          name: asset.fileName || 'image.jpg',
        };
        handleChange(fieldName, fileData);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Toast.show({
        type: 'error',
        text1: 'خطا',
        text2: 'انتخاب تصویر با مشکل مواجه شد',
      });
    }
  };

  // Improve prompt
  const improvePrompt = async () => {
    try {
      setImproPromptLoading(1);
      const token = storage.getString('token');
      
      const response = await axios.post(
        `${process.env.API_BASE_URL}/response/improveprompt/`,
        {
          type: "image",
          prompt: formValues.prompt
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": token,
          },
        }
      );
      
      setImproPromptLoading(2);
      handleChange('prompt', response.data.data.prompt);
      
      Toast.show({
        type: 'success',
        text1: 'موفق',
        text2: 'پرامپت بهبود یافت',
      });
      
    } catch (error) {
      setImproPromptLoading(0);
      if (error.response?.status === 403) {
        navigation.navigate('Login');
      } else {
        Toast.show({
          type: 'error',
          text1: 'خطا',
          text2: 'بهبود پرامپت با مشکل مواجه شد',
        });
      }
    }
  };

  // Validate form
  const validateForm = () => {
    if (!formData) return false;
    
    const newErrors = {};
    let isValid = true;
    
    formData.fields.forEach(field => {
      if (field.is_req && !formValues[field.name]) {
        newErrors[field.name] = field.error_msg || 'این فیلد الزامی است';
        isValid = false;
      }
    });
    
    setErrors(newErrors);
    return isValid;
  };

  // Submit form
  const handleSubmit = async () => {
    const taskStatus = storage.getString('model_task_sts');
    if (taskStatus === '3') {
      Toast.show({
        type: 'error',
        text1: 'توجه',
        text2: 'شما درخواست در حال اجرا دارید. لطفا تا نتیجه صبور باشید',
      });
      return;
    }
    
    if (!validateForm()) {
      Toast.show({
        type: 'error',
        text1: 'خطا',
        text2: 'لطفا فیلدهای الزامی را پر کنید',
      });
      return;
    }
    
    if (!walletApiSelected) {
      Toast.show({
        type: 'error',
        text1: 'خطا',
        text2: 'لطفا یک مدل انتخاب کنید',
      });
      return;
    }
    
    setIsSubmitting(true);
    setIsLoading(true);
    
    try {
      const token = storage.getString('token');
      
      const formDataToSend = new FormData();
      
      // Append form values
      Object.keys(formValues).forEach(key => {
        const value = formValues[key];
        
        if (value && typeof value === 'object' && value.uri) {
          formDataToSend.append(key, {
            uri: value.uri,
            type: value.type,
            name: value.name,
          });
        } else if (Array.isArray(value)) {
          value.forEach(item => formDataToSend.append(key, item));
        } else if (value !== null && value !== undefined) {
          formDataToSend.append(key, String(value));
        }
      });
      
      formDataToSend.append("page-id", ModelPageData.page_id);
      formDataToSend.append("api-info", walletApiSelected.id);
      
      const response = await axios({
        method: formData?.form_method || 'POST',
        url: `${process.env.API_BASE_URL}/response/images/${ModelPageData.pageInfo.slug}/`,
        data: formDataToSend,
        headers: {
          "Content-Type": "multipart/form-data",
          "Authorization": token,
        },
      });
      
      if (response.data.data) {
        if (response.data.data.resID && response.data.data.taskID) {
          storage.set('model_resID', response.data.data.resID);
          storage.set('model_taskID', response.data.data.taskID);
          storage.set('model_task_sts', response.data.data.status);
          getGpuTaskInterval();
          setIsLoading(true);
          
          Toast.show({
            type: 'success',
            text1: 'موفق',
            text2: 'دستور شما در حال پردازش است',
          });
        } else {
          setDataOutput({
            output: response.data.data.output,
            type: response.data.data.type,
          });
          fetchHistory();
        }
      }
      
      // Reset form values
      const resetValues = {};
      formData.fields.forEach(field => {
        resetValues[field.name] = '';
      });
      setFormValues(resetValues);
      
    } catch (error) {
      console.error('Form submission error:', error);
      
      if (error.response?.status === 403) {
        navigation.navigate('Login');
      } else {
        Toast.show({
          type: 'error',
          text1: 'خطا',
          text2: error.response?.data?.message || 'ارسال فرم با مشکل مواجه شد',
        });
      }
      
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  };

  // Poll for result
  const getGpuTaskInterval = () => {
    const taskId = storage.getString('model_taskID');
    const resId = storage.getString('model_resID');
    
    if (!taskId || !resId) return;
    
    const intervalId = setInterval(async () => {
      try {
        const token = storage.getString('token');
        const response = await axios.post(
          `${process.env.API_BASE_URL}/response/tasks/`,
          {
            task_id: taskId,
            res_id: resId,
          },
          {
            headers: {
              "Content-Type": "application/json",
              "Authorization": token,
            },
          }
        );
        
        if (response.data.data?.status === 2) {
          clearInterval(intervalId);
          storage.set('model_task_sts', '2');
          
          setDataOutput({
            output: response.data.data.output,
            type: response.data.data.type,
          });
          setIsLoading(false);
          
          Toast.show({
            type: 'success',
            text1: 'موفق',
            text2: 'خروجی شما با موفقیت ایجاد شد',
          });
          
          fetchHistory();
        }
        
      } catch (error) {
        console.error('Polling error:', error);
        clearInterval(intervalId);
        setIsLoading(false);
        storage.set('model_task_sts', '2');
      }
    }, 10000);
    
    return () => clearInterval(intervalId);
  };

  // Fetch history
  const fetchHistory = async () => {
    try {
      const token = storage.getString('token');
      const response = await axios.get(
        `${process.env.API_BASE_URL}/models/${ModelPageData.pageInfo.slug}/?history_limit=25`,
        {
          headers: {
            Authorization: token,
            'Content-Type': 'application/json'
          },
        }
      );
      
      if (response.data.data?.history) {
        setHistory(response.data.data.history);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  // Handle history item selection
  const handleHistory = (item) => {
    ParenHandleSideBar();
    
    setDataOutput({
      output: item.output.output,
      type: item.output.type,
    });
    
    setFormValues(item.input);
    
    // Check if wizard mode
    const hasWizard = ModelPageData.wallet_apis.some(api => api.parent !== 0);
    if (hasWizard && item.output.origin_task_id) {
      setIsWizard(true);
      setOriginTaskID(item.output.origin_task_id);
    }
  };

  // Handle delete history
  const handleDeleteHistory = async (id) => {
    ParenHandleSideBar();
    
    try {
      const token = storage.getString('token');
      await axios.post(
        `${process.env.API_BASE_URL}/response/deletepagehistory/`,
        { history_id: id },
        { headers: { Authorization: token } }
      );
      
      fetchHistory();
    } catch (error) {
      console.error('Error deleting history:', error);
    }
  };

  // Render field based on type
  const renderField = (field) => {
    switch (field.field) {
      case 'input':
        return renderInputField(field);
      case 'select':
        return renderSelectField(field);
      case 'textarea':
        return renderTextareaField(field);
      default:
        return null;
    }
  };

  const renderInputField = (field) => {
    switch (field.field_type) {
      case 'text':
      case 'email':
      case 'number':
      case 'password':
      case 'tel':
      case 'url':
        return (
          <View style={styles.fieldContainer} key={field.name}>
            <Text style={styles.label}>
              {field.label}
              {field.is_req === 1 && <Text style={styles.requiredStar}> *</Text>}
            </Text>
            <TextInput
              style={[styles.input, errors[field.name] && styles.inputError]}
              value={formValues[field.name] || ''}
              onChangeText={(text) => handleChange(field.name, text)}
              placeholder={field.label}
              placeholderTextColor="#666"
              secureTextEntry={field.field_type === 'password'}
              keyboardType={
                field.field_type === 'email' ? 'email-address' :
                field.field_type === 'number' ? 'numeric' :
                field.field_type === 'tel' ? 'phone-pad' :
                'default'
              }
            />
            {errors[field.name] && (
              <Text style={styles.errorText}>{errors[field.name]}</Text>
            )}
          </View>
        );

      case 'file':
        return (
          <View style={styles.fieldContainer} key={field.name}>
            <Text style={styles.label}>
              {field.label}
              {field.is_req === 1 && <Text style={styles.requiredStar}> *</Text>}
            </Text>
            
            {formValues[field.name]?.uri ? (
              <View style={styles.imagePreviewContainer}>
                <Image
                  source={{ uri: formValues[field.name].uri }}
                  style={styles.imagePreview}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => handleChange(field.name, null)}
                >
                  <Icon name="close-circle" size={24} color="#ff4444" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.fileUploadButton}
                onPress={() => pickImage(field.name)}
              >
                <Icon name="cloud-upload-outline" size={32} color="#666" />
                <Text style={styles.fileUploadText}>انتخاب فایل</Text>
              </TouchableOpacity>
            )}
            
            {errors[field.name] && (
              <Text style={styles.errorText}>{errors[field.name]}</Text>
            )}
          </View>
        );

      case 'checkbox':
        return (
          <View style={styles.fieldContainer} key={field.name}>
            <Text style={styles.label}>
              {field.label}
              {field.is_req === 1 && <Text style={styles.requiredStar}> *</Text>}
            </Text>
            
            {field.settings ? (
              field.settings.map((option) => (
                <View key={option.value} style={styles.checkboxContainer}>
                  <CheckBox
                    value={(formValues[field.name] || []).includes(option.value)}
                    onValueChange={(checked) =>
                      handleCheckboxChange(field.name, option.value, checked)
                    }
                    tintColors={{ true: '#007AFF', false: '#666' }}
                  />
                  <Text style={styles.checkboxLabel}>{option.label}</Text>
                </View>
              ))
            ) : (
              <View style={styles.checkboxContainer}>
                <CheckBox
                  value={formValues[field.name] || false}
                  onValueChange={(checked) => handleChange(field.name, checked)}
                  tintColors={{ true: '#007AFF', false: '#666' }}
                />
                <Text style={styles.checkboxLabel}>{field.label}</Text>
              </View>
            )}
          </View>
        );

      case 'range':
        return (
          <View style={styles.fieldContainer} key={field.name}>
            <Text style={styles.label}>
              {field.label}: {formValues[field.name] || field.settings?.[0]?.min || 0}
              {field.is_req === 1 && <Text style={styles.requiredStar}> *</Text>}
            </Text>
            
            <Slider
              style={styles.slider}
              minimumValue={field.settings?.[0]?.min || 0}
              maximumValue={field.settings?.[0]?.max || 100}
              step={field.settings?.[0]?.step || 1}
              value={formValues[field.name] || field.settings?.[0]?.min || 0}
              onValueChange={(value) => handleChange(field.name, value)}
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#ddd"
            />
          </View>
        );

      default:
        return null;
    }
  };

  const renderSelectField = (field) => {
    if (field.name === "size" || field.name === "output-size" || field.name === "aspect_ratio") {
      const options = field.settings || [];
      const showAll = showAllOptions[field.name] || false;
      const displayedOptions = showAll ? options : options.slice(0, 6);
      
      return (
        <View style={styles.fieldContainer} key={field.name}>
          <Text style={styles.label}>
            {field.label}
            {field.is_req === 1 && <Text style={styles.requiredStar}> *</Text>}
          </Text>
          
          <View style={styles.gridContainer}>
            {displayedOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.gridItem,
                  formValues[field.name] === option.value && styles.selectedGridItem,
                ]}
                onPress={() => handleChange(field.name, option.value)}
              >
                <Text style={[
                  styles.gridItemText,
                  formValues[field.name] === option.value && styles.selectedGridItemText,
                ]}>
                  {option.label}
                </Text>
                {parseDimensions(option.label)}
              </TouchableOpacity>
            ))}
          </View>
          
          {options.length > 6 && (
            <TouchableOpacity
              style={styles.showMoreButton}
              onPress={() => setShowAllOptions(prev => ({
                ...prev,
                [field.name]: !showAll
              }))}
            >
              <Text style={styles.showMoreText}>
                {showAll ? 'نمایش کمتر' : 'نمایش بیشتر'}
              </Text>
              <Icon 
                name={showAll ? 'chevron-up' : 'chevron-down'} 
                size={16} 
                color="#007AFF" 
              />
            </TouchableOpacity>
          )}
        </View>
      );
    } else {
      return (
        <View style={styles.fieldContainer} key={field.name}>
          <Text style={styles.label}>
            {field.label}
            {field.is_req === 1 && <Text style={styles.requiredStar}> *</Text>}
          </Text>
          
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formValues[field.name] || ''}
              onValueChange={(itemValue) => handleChange(field.name, itemValue)}
              style={styles.picker}
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
        </View>
      );
    }
  };

  const renderTextareaField = (field) => {
    if (field.name === "prompt") {
      return (
        <View style={styles.fieldContainer} key={field.name}>
          <Text style={styles.label}>
            {field.label}
            {field.is_req === 1 && <Text style={styles.requiredStar}> *</Text>}
          </Text>
          
          <View style={styles.textareaContainer}>
            <TextInput
              style={[styles.textarea, errors[field.name] && styles.inputError]}
              value={formValues[field.name] || ''}
              onChangeText={(text) => handleChange(field.name, text)}
              placeholder="دستور خود را اینجا بنویسید"
              placeholderTextColor="#666"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            
            <TouchableOpacity
              style={styles.improveButton}
              onPress={improvePrompt}
              disabled={improPromptLoading === 1}
            >
              {improPromptLoading === 1 ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Icon name="star" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
          
          {errors[field.name] && (
            <Text style={styles.errorText}>{errors[field.name]}</Text>
          )}
        </View>
      );
    } else {
      return (
        <View style={styles.fieldContainer} key={field.name}>
          <Text style={styles.label}>
            {field.label}
            {field.is_req === 1 && <Text style={styles.requiredStar}> *</Text>}
          </Text>
          
          <TextInput
            style={[styles.textarea, errors[field.name] && styles.inputError]}
            value={formValues[field.name] || ''}
            onChangeText={(text) => handleChange(field.name, text)}
            placeholder="متن خود را وارد کنید"
            placeholderTextColor="#666"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          
          {errors[field.name] && (
            <Text style={styles.errorText}>{errors[field.name]}</Text>
          )}
        </View>
      );
    }
  };

  // Parse dimensions for icons
  const parseDimensions = (label) => {
    const numbers = label.match(/\d+/g);
    if (!numbers || numbers.length < 2) return null;
    
    const width = parseInt(numbers[0]);
    const height = parseInt(numbers[1]);
    
    if (width === height) {
      return <Icon name="square-outline" size={20} color="#666" />;
    } else if (width > height) {
      return <Icon name="rectangle-outline" size={20} color="#666" />;
    } else if (width < height) {
      return <Icon name="phone-portrait-outline" size={20} color="#666" />;
    }
    
    return null;
  };

  // Render wallet API dropdown
  const renderWalletApiDropdown = () => {
    const walletApis = ModelPageData?.wallet_apis || [];
    
    if (walletApis.length === 0) return null;
    
    if (walletApis.length === 1) {
      return (
        <View style={styles.singleApiContainer}>
          <View style={styles.apiInfo}>
            <Image 
              source={{ uri: walletApis[0].img_url || 'https://via.placeholder.com/50' }}
              style={styles.apiImage}
            />
            <View style={styles.apiDetails}>
              <Text style={styles.apiTitle}>{walletApis[0].title}</Text>
              <Text style={styles.apiPrice}>{walletApis[0].price_txt}</Text>
            </View>
          </View>
        </View>
      );
    }
    
    return (
      <View style={styles.apiDropdownContainer}>
        <TouchableOpacity
          style={styles.apiDropdownButton}
          onPress={() => setIsModalOpen(true)}
        >
          {walletApiSelected ? (
            <View style={styles.selectedApi}>
              <Image 
                source={{ uri: walletApiSelected.img_url || 'https://via.placeholder.com/50' }}
                style={styles.apiImageSmall}
              />
              <Text style={styles.selectedApiText}>{walletApiSelected.title}</Text>
              <Icon name="chevron-down" size={20} color="#fff" />
            </View>
          ) : (
            <View style={styles.selectApiPlaceholder}>
              <Text style={styles.selectApiText}>انتخاب مدل</Text>
              <Icon name="chevron-down" size={20} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
        
        {/* Wallet API Modal */}
        <Modal
          visible={isModalOpen}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsModalOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>انتخاب مدل</Text>
                <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                  <Icon name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={walletApis}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.apiOption}
                    onPress={() => {
                      setWalletApiSelected(item);
                      setIsModalOpen(false);
                    }}
                  >
                    <Image 
                      source={{ uri: item.img_url || 'https://via.placeholder.com/50' }}
                      style={styles.apiOptionImage}
                    />
                    <View style={styles.apiOptionDetails}>
                      <Text style={styles.apiOptionTitle}>{item.title}</Text>
                      <Text style={styles.apiOptionPrice}>{item.price_txt}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  // Render output
  const renderOutput = () => {
    if (!dataOutput.output) return null;
    
    if (dataOutput.type === "image" || !dataOutput.type) {
      return (
        <View style={styles.outputContainer}>
          <Image
            source={{ uri: dataOutput.output }}
            style={styles.outputImage}
            resizeMode="contain"
          />
          
          <View style={styles.outputActions}>
            <TouchableOpacity style={styles.outputActionButton}>
              <Icon name="download-outline" size={24} color="#fff" />
              <Text style={styles.outputActionText}>دانلود</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.outputActionButton}>
              <Icon name="create-outline" size={24} color="#fff" />
              <Text style={styles.outputActionText}>ویرایش</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    
    if (dataOutput.type === "img_array") {
      return (
        <View style={styles.imageArrayContainer}>
          <FlatList
            horizontal
            data={dataOutput.output}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item, index }) => (
              <View style={styles.imageArrayItem}>
                <Image
                  source={{ uri: item }}
                  style={styles.arrayImage}
                  resizeMode="cover"
                />
                <View style={styles.imageArrayOverlay}>
                  <Text style={styles.imageIndex}>عکس {index + 1}</Text>
                </View>
              </View>
            )}
            showsHorizontalScrollIndicator={false}
          />
        </View>
      );
    }
    
    if (dataOutput.type === "text") {
      return (
        <View style={styles.textOutputContainer}>
          <ScrollView style={styles.textOutputScroll}>
            <Text style={styles.textOutput}>{dataOutput.output}</Text>
          </ScrollView>
          
          <TouchableOpacity style={styles.copyButton}>
            <Text style={styles.copyButtonText}>کپی متن</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return null;
  };

  if (!formData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>در حال بارگذاری فرم...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        {ModelPageData.pageInfo?.title && (
          <Text style={styles.pageTitle}>{ModelPageData.pageInfo.title}</Text>
        )}
        
        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Form Section */}
          <View style={styles.formSection}>
            <View style={styles.formContainer}>
              {renderWalletApiDropdown()}
              
              <View style={styles.fieldsGrid}>
                {formData.fields.map((field) => renderField(field))}
              </View>
              
              <SubmitBtn onPress={handleSubmit} loading={isSubmitting} />
              
              {/* File Usage Info */}
              {ModelPageData?.total_file_count !== -1 && 
               ModelPageData?.total_file_count !== 0 && (
                <View style={styles.fileUsageContainer}>
                  <Text style={styles.fileUsageText}>
                    {ModelPageData.total_file_txt}: {ModelPageData.file_used_count}/{ModelPageData.total_file_count}
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          {/* Output Section */}
          <View style={styles.outputSection}>
            {isLoading && (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.processingText}>در حال پردازش دستور شما هستیم</Text>
              </View>
            )}
            
            {renderOutput()}
          </View>
          
          {/* Samples Section */}
          {ModelPageData.pageInfo?.samples && (
            <View style={styles.samplesSection}>
              <Text style={styles.sectionTitle}>نمونه‌ها</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {Object.keys(ModelPageData.pageInfo.samples).map((key) => (
                  <TouchableOpacity
                    key={key}
                    style={styles.sampleItem}
                    onPress={() => {
                      const sample = ModelPageData.pageInfo.samples[key];
                      setDataOutput({
                        output: sample.output.output,
                        type: sample.type,
                      });
                      setFormValues(sample.form_data);
                    }}
                  >
                    <Image
                      source={{ uri: sample.output.output }}
                      style={styles.sampleImage}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          
          {/* Content Section */}
          {ModelPageData.pageInfo?.content && (
            <View style={styles.contentSection}>
              <Text style={styles.sectionTitle}>توضیحات</Text>
              <Text style={styles.contentText} numberOfLines={10}>
                {ModelPageData.pageInfo.content}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* History Sidebar for Mobile */}
      <Modal
        visible={mobileHistoryMenu}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setMobileHistoryMenu(false)}
      >
        <SideMenuMobile
          setMobileHistoryMenu={setMobileHistoryMenu}
          HistoryData={history}
          handleHistory={handleHistory}
          handleDeleteHistory={handleDeleteHistory}
          setDataOutput={setDataOutput}
          setFormValues={setFormValues}
        />
      </Modal>
      
      {/* History Button */}
      {history.length > 0 && (
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => setMobileHistoryMenu(true)}
        >
          <Icon name="time-outline" size={24} color="#fff" />
        </TouchableOpacity>
      )}
      
      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 16,
    color: '#333',
    paddingHorizontal: 16,
  },
  mainContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  formSection: {
    marginBottom: 24,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  apiDropdownContainer: {
    marginBottom: 20,
  },
  apiDropdownButton: {
    backgroundColor: '#054363',
    borderRadius: 8,
    padding: 16,
  },
  selectedApi: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedApiText: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 12,
  },
  selectApiPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectApiText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  singleApiContainer: {
    marginBottom: 20,
  },
  apiInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#054363',
    borderRadius: 8,
    padding: 16,
  },
  apiImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  apiDetails: {
    flex: 1,
  },
  apiTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  apiPrice: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  apiImageSmall: {
    width: 30,
    height: 30,
    borderRadius: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  apiOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  apiOptionImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
  },
  apiOptionDetails: {
    flex: 1,
  },
  apiOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  apiOptionPrice: {
    fontSize: 14,
    color: '#666',
  },
  fieldsGrid: {
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  requiredStar: {
    color: '#ff4444',
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
  },
  inputError: {
    borderColor: '#ff4444',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginTop: 8,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 12,
    padding: 4,
  },
  fileUploadButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileUploadText: {
    marginTop: 8,
    color: '#666',
    fontSize: 14,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  selectedGridItem: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  gridItemText: {
    color: '#333',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
  },
  selectedGridItemText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  showMoreText: {
    color: '#007AFF',
    fontSize: 14,
    marginRight: 4,
  },
  pickerContainer: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    color: '#333',
  },
  textareaContainer: {
    position: 'relative',
  },
  textarea: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  improveButton: {
    position: 'absolute',
    left: 8,
    top: 8,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileUsageContainer: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  fileUsageText: {
    color: '#fff',
    fontSize: 12,
  },
  outputSection: {
    marginBottom: 24,
  },
  processingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  processingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  outputContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  outputImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 16,
  },
  outputActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  outputActionButton: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 120,
    justifyContent: 'center',
  },
  outputActionText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
  },
  imageArrayContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  imageArrayItem: {
    position: 'relative',
    marginRight: 12,
  },
  arrayImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
  },
  imageArrayOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  imageIndex: {
    color: '#fff',
    fontSize: 12,
  },
  textOutputContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  textOutputScroll: {
    maxHeight: 200,
  },
  textOutput: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  copyButton: {
    backgroundColor: '#666',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  copyButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  samplesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  sampleItem: {
    marginRight: 12,
  },
  sampleImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  contentSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  contentText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  historyButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#007AFF',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
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
});

export default DynamicFormWallet;