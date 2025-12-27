// components/DynamicForm.jsx
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
  Dimensions,
  Platform,
  SafeAreaView,
  FlatList,
} from 'react-native';
import axios from 'axios';
import { createMMKV } from 'react-native-mmkv';
import { launchImageLibrary } from 'react-native-image-picker';
// import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import CheckBox from '@react-native-community/checkbox';
import Slider from '@react-native-community/slider';
// import RNFS from 'react-native-fs';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';

// Icons
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AntDesign from 'react-native-vector-icons/AntDesign';
import GlowButton from './SubmitBtn'
import RTLPicker from '../../components/Models/CustomePicker';
import Config from 'react-native-config';


// Initialize MMKV
const storage = new createMMKV();

const DynamicForm = ({ ModelFormData, ModelPageData }) => {
  const [formData, setFormData] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedValues, setSelectedValues] = useState({});
  const [history, setHistory] = useState([]);
  const [dataOutput, setDataOutput] = useState({});
  const [showAllOptions, setShowAllOptions] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [improPromptLoading, setImproPromptLoading] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);

  const apiUrl = Config.API_URL;
  const refererUrl = Config.Referer_URL;
  const hostUrl = Config.Host_URL;
  const Host_for_strem = Config.Host_for_strem;  

   const toggleSelection = (value) => {
    setSelectedValues(prev => {
      // اگر قبلا انتخاب شده بود، آن را بردار
      if (prev[value]) {
        const newState = {...prev};
        // delete newState[value];
        return newState;
      } 
      // در غیر این صورت اضافه کن
      else {
        return { [value]: true};
      }
    });
  };


  const handleChangeCustom = (nm,value) => {

  setFormValues({
    ...formValues, 
    [nm]:value,
  })
  console.log("in handle change custom--->" , formValues)
}

  // Initialize form data
  useEffect(() => {
    if (ModelFormData) {
      setFormData(ModelFormData);
      
      const initialValues = {};
      ModelFormData.fields.forEach(field => {
        if (field.field_type === 'checkbox' && field.settings) {
          initialValues[field.name] = [];
        } else {
          initialValues[field.name] = '';
        }
      });
      setFormValues(initialValues);
    }
    
    if (ModelPageData?.history) {
      setHistory(ModelPageData.history);
    }
  }, [ModelFormData, ModelPageData]);

  // Handle text input changes
  const handleChange = (name, value) => {
    setFormValues(prev => ({
      ...prev,
      [name]: value,
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  // Handle checkbox changes
  const handleCheckboxChange = (name, value, checked) => {
    setFormValues(prev => {
      const currentValues = prev[name] || [];
      
      if (checked) {
        return {
          ...prev,
          [name]: [...currentValues, value],
        };
      } else {
        return {
          ...prev,
          [name]: currentValues.filter(v => v !== value),
        };
      }
    });
  };

  // Handle image picker
  const pickImage = async (fieldName) => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });
      
      if (result.assets && result.assets[0]) {
        const uri = result.assets[0].uri;
        setSelectedImage(uri);
        handleChange(fieldName, {
          uri,
          type: result.assets[0].type,
          name: result.assets[0].fileName || 'image.jpg',
        });
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

  // Date picker handlers
  const onDateChange = (event, selected) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selected) {
      setSelectedDate(selected);
      handleChange('date', selected.toISOString().split('T')[0]);
    }
  };

  const onTimeChange = (event, selected) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selected) {
      handleChange('time', selected.toTimeString().split(' ')[0]);
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

  // Get token from MMKV
  const getToken = () => {
    return storage.getString('token') || '';
  };

  // Improve prompt function
  const improvePrompt = async () => {
    try {
      setImproPromptLoading(1);
      const token = getToken();
      
      if (!token) {
        navigation.navigate('Login');
        return;
      }
      console.log("prompt",formValues.prompt)
      const response = await axios.post(
        `${apiUrl}/response/improveprompt/`,
        {
          type: "image",
          prompt: formValues.prompt
        },
        {
          headers: {
            Authorization: storage.getString("token") || "",
            "Content-Type": "application/json",
            Referer: refererUrl,
            // Host: hostUrl,
          },
             baseURL: hostUrl,
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
      console.log("err resp ", error.response)
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

  // Submit form
  const handleSubmit = async () => {
    if (!validateForm()) {
      Toast.show({
        type: 'error',
        text1: 'خطا',
        text2: 'لطفا فیلدهای الزامی را پر کنید',
      });
      return;
    }
    
    setIsSubmitting(true);
    setIsLoading(true);
    
    try {
      const token = getToken();
      
      if (!token) {
        navigation.navigate('Login');
        return;
      }
      
      const formDataToSend = new FormData();
      
      Object.keys(formValues).forEach(key => {
        const value = formValues[key];
        
        if (value && typeof value === 'object' && value.uri) {
          formDataToSend.append(key, {
            uri: value.uri,
            type: value.type,
            name: value.name,
          });
        } else if (Array.isArray(value)) {
          value.forEach(item => {
            formDataToSend.append(key, item);
          });
        } else if (value !== null && value !== undefined) {
          formDataToSend.append(key, String(value));
        }
      });
      
      formDataToSend.append("page-id", ModelPageData.page_id);
      console.log("form Data" , formDataToSend)
      const response = await axios({
        method: formData?.form_method || 'POST',
        url: `${apiUrl}/response/images/${formData?.form_slug}/?lang=fa&style=dark`,
        data: formDataToSend,
        headers: {
          "Content-Type": "multipart/form-data",
          "Authorization": token,
           Referer: refererUrl,
            // Host: hostUrl,
          },
            baseURL: hostUrl,
      });
      
      if (response.data.data) {
        storage.set('model_resID', response.data.data.resID);
        storage.set('model_taskID', response.data.data.taskID);
        storage.set('model_pageWorker', `models/${formData?.form_slug.replace(/-\d*$/, '')}`);
        
        Toast.show({
          type: 'success',
          text1: 'موفق',
          text2: 'درخواست شما ثبت شد',
        });
        
        pollForResult(response.data.data.taskID, response.data.data.resID);
      }
      
    } catch (error) {
      console.log('Submission error:', error.response);
      
      if (error.response?.status === 403) {
        navigation.navigate('Login');
      } else {
        Toast.show({
          type: 'error',
          text1: 'خطا',
          text2: error.response?.data?.message || 'ارسال فرم با مشکل مواجه شد',
        });
      }
      
      setIsLoading(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Poll for result
  const pollForResult = async (taskId, resId) => {
    const token = getToken();
    const intervalId = setInterval(async () => {
      try {
        const response = await axios.post(
          `${apiUrl}/response/tasks/`,
          {
            task_id: taskId,
            res_id: resId,
          },
          {
            headers: {
              "Content-Type": "application/json",
              "Authorization": token,
               Referer: refererUrl,
            },
            baseURL:hostUrl
          }
        );
        console.log("in poolig" , response.data.data)
         if(response.data.data?.type && response.data.data?.output){
          clearInterval(intervalId);
          setDataOutput({
            output: response.data.data.output,
            type: response.data.data.type,
          });
          setIsLoading(false);
          
          Toast.show({
            type: 'success',
            text1: 'موفق',
            text2: 'نتیجه آماده شد',
          });
        }       
        if(response.data.data?.status === 1){
          clearInterval(intervalId);
          // setDataOutput({
          //   output: response.data.data.output,
          //   type: response.data.data.type,
          // });
          // setIsLoading(false);
          
          Toast.show({
            type: 'error',
            text1: 'ناموفق',
            text2: 'در پردازش مشکلی پیش آمده لطفا بعدا تلاش کنید ',
          });
        }
        if (response.data.data?.status === 2) {
          clearInterval(intervalId);
          setDataOutput({
            output: response.data.data.output,
            type: response.data.data.type,
          });
          setIsLoading(false);
          
          Toast.show({
            type: 'success',
            text1: 'موفق',
            text2: 'نتیجه آماده شد',
          });
        }
        
      } catch (error) {
        clearInterval(intervalId);
        setIsLoading(false);
        console.error('Polling error:', error);
      }
    }, 10000);
  };

  // Render input fields
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
              style={[
                styles.input,
                errors[field.name] && styles.inputError,
              ]}
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
      case 'radio-query':
          const displayedOptions = showAll 
            ? [...field.settings].reverse()
            : field.settings?.slice(0, 6).reverse();

          return (
            <View key={field.name} style={styles.radioQueryContainer}>
              <Text style={[styles.radioQueryLabel, isDarkMode && styles.darkText]}>
                {field.label}
                {field.is_req === 1 && <Text style={styles.requiredStar}> *</Text>}
              </Text>

              <FlatList
                data={displayedOptions}
                numColumns={3}
                keyExtractor={(item) => item.value.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.radioQueryItem,
                      selectedValues[item.value] && [
                        styles.radioQueryItemSelected,
                        isDarkMode && styles.darkRadioQueryItemSelected,
                      ],
                    ]}
                    onPress={() => {
                      toggleSelection(item.value);
                      handleChangeCustom(field.name, item.value);
                    }}
                  >
                    <Image
                      source={{ uri: item.img_url }}
                      style={styles.radioQueryImage}
                    />
                    <View style={styles.radioQueryLabelContainer}>
                      <Text style={styles.radioQueryItemLabel}>{item.label}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />

              {field.settings?.length > 6 && (
                <TouchableOpacity
                  onPress={() => setShowAll(!showAll)}
                  style={styles.showMoreButton}
                >
                  <Text style={styles.showMoreText}>
                    {showAll ? 'بستن' : 'بیشتر'}
                  </Text>
                </TouchableOpacity>
              )}

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

      case 'date':
        return (
          ""
          // <View style={styles.fieldContainer} key={field.name}>
          //   <Text style={styles.label}>
          //     {field.label}
          //     {field.is_req === 1 && <Text style={styles.requiredStar}> *</Text>}
          //   </Text>
            
          //   <TouchableOpacity
          //     style={[styles.input, styles.dateInput]}
          //     onPress={() => setShowDatePicker(true)}
          //   >
          //     <Text style={styles.dateText}>
          //       {formValues[field.name] || 'انتخاب تاریخ'}
          //     </Text>
          //     <Icon name="calendar-outline" size={20} color="#666" />
          //   </TouchableOpacity>
            
          //   {showDatePicker && (
          //     <DateTimePicker
          //       value={selectedDate}
          //       mode="date"
          //       display="default"
          //       onChange={onDateChange}
          //     />
          //   )}
          // </View>
        );

      case 'time':
        return (
          ""
          // <View style={styles.fieldContainer} key={field.name}>
          //   <Text style={styles.label}>
          //     {field.label}
          //     {field.is_req === 1 && <Text style={styles.requiredStar}> *</Text>}
          //   </Text>
            
          //   <TouchableOpacity
          //     style={[styles.input, styles.dateInput]}
          //     onPress={() => setShowTimePicker(true)}
          //   >
          //     <Text style={styles.dateText}>
          //       {formValues[field.name] || 'انتخاب زمان'}
          //     </Text>
          //     <Icon name="time-outline" size={20} color="#666" />
          //   </TouchableOpacity>
            
          //   {showTimePicker && (
          //     <DateTimePicker
          //       value={new Date()}
          //       mode="time"
          //       display="default"
          //       onChange={onTimeChange}
          //     />
          //   )}
          // </View>
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
      return (
        <View style={styles.fieldContainer} key={field.name}>
          <Text style={styles.label}>
            {field.label}
            {field.is_req === 1 && <Text style={styles.requiredStar}> *</Text>}
          </Text>
          
          <View style={styles.gridContainer}>
            {field.settings?.map((option) => (
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
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    } else {
      return (
        <View style={styles.fieldContainer} key={field.name}>
          <Text style={styles.label}>
            {field.label}
            {field.is_req === 1 && <Text style={styles.requiredStar}> *</Text>}
          </Text>
          
          <View>
            {/* <Picker
              selectedValue={formValues[field.name] || ''}
              onValueChange={(itemValue) => handleChange(field.name, itemValue)}
              // style={styles.picker}
                style={{
                  writingDirection: 'rtl', // مهم
                  // Android همیشه دقیق رعایت نمی‌کند
                }}
                itemStyle={{
                  writingDirection: 'rtl',
                  textAlign: 'right',
                }}


            >
              <Picker.Item label="انتخاب کنید..." value="" />
              {field.settings?.map((option) => (
                <Picker.Item
                  key={option.value}
                  label={option.label}
                  value={option.value}
                />
              ))}
            </Picker> */}

            <RTLPicker
              selectedValue={formValues[field.name] || ''}
              onValueChange={(value) => handleChange(field.name, value)}
              options={field.settings}
              placeholder="انتخاب کنید..."
              label=""
            />


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
              style={[
                styles.textarea,
                errors[field.name] && styles.inputError,
              ]}
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
            style={[
              styles.textarea,
              errors[field.name] && styles.inputError,
            ]}
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
            <TouchableOpacity style={styles.actionButton}>
              <Icon name="download-outline" size={24} color="#fff" />
              <Text style={styles.actionText}>دانلود</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Icon name="create-outline" size={24} color="#fff" />
              <Text style={styles.actionText}>ویرایش</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    
    if (dataOutput.type === "int") {
      return (
        <View style={styles.outputContainer}>
          <View style={styles.chartContainer}>
            <Text style={styles.chartValue}>{dataOutput.output}%</Text>
            <Text style={styles.chartLabel}>درصد استفاده شده از هوش مصنوعی</Text>
          </View>
        </View>
      );
    }
    
    if (dataOutput.type === "text") {
      return (
        <View style={styles.outputContainer}>
          <ScrollView style={styles.textOutputContainer}>
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {ModelPageData.pageInfo?.title && (
          <Text style={styles.pageTitle}>{ModelPageData.pageInfo.title}</Text>
        )}
        
        <View  style={styles.formContainer}>
          {formData?.fields.map((field) => renderField(field))}
        </View>
        

        
        {ModelPageData?.total_file_count !== -1 && 
         ModelPageData?.total_file_count !== 0 && (
          <View style={styles.fileUsageContainer}>
            <Text style={styles.fileUsageText}>
              {ModelPageData?.total_file_txt}: {ModelPageData?.file_used_count}/{ModelPageData?.total_file_count}
            </Text>
          </View>
        )}
        
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>در حال پردازش دستور شما هستیم</Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.submitButton,
          ]}
          onPress={handleSubmit}
          disabled={isLoading || isSubmitting}
        >
        
          <GlowButton onPress={handleSubmit} />
        </TouchableOpacity>

        
        {renderOutput()}
        
        {ModelPageData.pageInfo?.samples && (
          <View style={styles.samplesContainer}>
            <Text style={styles.sectionTitle}>نمونه‌ها</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {Object.keys(ModelPageData.pageInfo.samples).map((key) => (
                <TouchableOpacity
                  key={key}
                  style={styles.sampleItem}
                  onPress={() => {
                    setDataOutput({
                      output: ModelPageData.pageInfo.samples[key].output.output,
                      type: ModelPageData.pageInfo.samples[key].type,
                    });
                    setFormValues(ModelPageData.pageInfo.samples[key].form_data);
                  }}
                >
                  <Image
                    source={{ uri: ModelPageData.pageInfo.samples[key].output.output }}
                    style={styles.sampleImage}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        
        {ModelPageData.pageInfo?.content && (
          <View style={styles.contentContainer}>
            <Text style={styles.sectionTitle}>توضیحات</Text>
            <Text style={styles.contentText} numberOfLines={10}>
              {ModelPageData.pageInfo.content}
            </Text>
          </View>
        )}
      </ScrollView>
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>تاریخچه</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={history}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.historyItem}
                  onPress={() => {
                    setDataOutput({
                      output: item.output.output,
                      type: item.output.type,
                    });
                    setFormValues(item.input);
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.historyText} numberOfLines={1}>
                    {item.input.prompt || 'بدون عنوان'}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
      
      {history.length > 0 && (
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => setModalVisible(true)}
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
    marginTop:20
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    color: '#333',
  },
  formContainer: {
    direction:'rtl',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fieldContainer: {
    marginBottom: 20,
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
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    color: '#333',
    fontSize: 16,
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
    backgroundColor: '#00000',
    borderColor: '#007AFF',
    direction:'rtl'
  },
  gridItemText: {
    color: '#333',
    fontSize: 14,
    textAlign: 'center',
  },
  selectedGridItemText: {
    color: '#000',
    fontWeight: 'bold',
  },
  pickerContainer: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    overflow: 'hidden',
    direction:'rtl',
    textAlign:'center'
  },
  picker: {
    height: 50,
    color: '#000',
    direction:'rtl',
    textAlign:'right',
    writingDirection: 'rtl'
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
    left: -8,
    bottom: -8,
    backgroundColor: '#000',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {

    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  submitButtonDisabled: {
    
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  fileUsageContainer: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  fileUsageText: {
    color: '#fff',
    fontSize: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  outputContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  outputImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
  },
  outputActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  actionButton: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  actionText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  chartValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  chartLabel: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  textOutputContainer: {
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
  samplesContainer: {
    marginBottom: 20,
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
  contentContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contentText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  historyItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  historyText: {
    fontSize: 14,
    color: '#333',
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



radioQueryContainer: {
    marginBottom: 16,

  },
  radioQueryLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#00',
  },
  radioQueryItem: {
    flex: 1,
    maxWidth:'30%',
    margin: 4,
    borderWidth: 2,
    borderColor: '#cbd6dd',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  radioQueryItemSelected: {
    borderColor: '#007AFF',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  darkRadioQueryItemSelected: {
    borderColor: '#000',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  radioQueryImage: {
    width: '100%',
    height: 80,
    borderRadius: 4,
  },
  radioQueryLabelContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#000",
    // 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 4,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  radioQueryItemLabel: {
    fontSize: 10,
    textAlign: 'center',
    color: '#fff',
  },
  showMoreButton: {
    alignItems: 'center',
    marginTop: 12,
  },
  showMoreText: {
    color: '#3b82f6',
    fontWeight: '500',
    fontSize: 14,
  },

});

export default DynamicForm;