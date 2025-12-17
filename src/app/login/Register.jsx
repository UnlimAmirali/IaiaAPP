import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import axios from 'axios';
import { createMMKV } from 'react-native-mmkv';
import Config from 'react-native-config';
import DatePicker, { getFormatedDate } from 'react-native-modern-datepicker';

// مقداردهی اولیه MMKV
const storage = new createMMKV();

const Register = ({ handleStep, handleSetCountdown, lang }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [family, setFamily] = useState('');
  const [password, setPassword] = useState('');
  const [RePassword, setRePassword] = useState('');
  const [persianBirthday, setPersianBirthday] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [date, setDate] = useState(getFormatedDate(new Date(), 'jYYYY/jMM/jDD'));
  
  // const router = useRouter();
  const apiUrl = Config.API_URL;

  const handleDateChange = (selectedDate) => {
    setDate(selectedDate);
    setPersianBirthday(selectedDate);
  };

  const handleRegister = async () => {
    setLoading(true);
    setError('');

    // اعتبارسنجی
    if (password !== RePassword) {
      setError('رمز عبور و تکرار آن مطابقت ندارند');
      setLoading(false);
      return;
    }

    if (!name || !family || !password || !persianBirthday) {
      setError('لطفا تمامی فیلدهای ضروری را پر کنید');
      setLoading(false);
      return;
    }

    try {
      const vid = storage.getString('vid');
      const mobile = storage.getString('mobile');

      const response = await axios.post(
        `${apiUrl}/login/register/`,
        {
          name: name,
          lastName: family,
          vid: storage.getString("vid"),
          mobile: mobile,
          password: password,
          're-password': RePassword,
          'persian-birthday': persianBirthday,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Referer: 'https://test.irani-ai.com/',
          },
          // تنظیم Host معمولاً از طریق baseURL بهتر است
          baseURL: 'https://api2.irani-ai.com',
        } 
      );

      // ذخیره در MMKV
      storage.set('uid', string(response.data.data.uid));
      storage.set('token', string(response.data.data.token));
      console.log("resp" , response.data)
      setIsRegister(true);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'خطا در ثبت‌نام');
      setLoading(false);
    }
  };

  const closeDatePicker = () => {
    setShowDatePicker(false);
  };

  const openDatePicker = () => {
    setShowDatePicker(true);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <Text style={styles.title}>تایید شماره موبایل</Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.formContainer}>
          <Text style={styles.mobileText}>
            نام کاربری شما {storage.getString('mobile')}
          </Text>

          {/* ردیف نام و نام خانوادگی */}
          <View style={styles.rowContainer}>
            {/* فیلد نام خانوادگی */}
            <View style={[styles.inputContainer, styles.halfInput, styles.rightMargin]}>
              <TextInput
                style={styles.input}
                value={family}
                onChangeText={setFamily}
                placeholder="نام خانوادگی"
                placeholderTextColor="#666"
              />
            </View>

            {/* فیلد نام */}
            <View style={[styles.inputContainer, styles.halfInput, styles.leftMargin]}>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="نام"
                placeholderTextColor="#666"
              />
            </View>
          </View>

          {/* ردیف رمز عبور و تکرار رمز عبور */}
          <View style={styles.rowContainer}>
            {/* فیلد تکرار رمز عبور */}
            <View style={[styles.inputContainer, styles.halfInput, styles.rightMargin]}>
              <TextInput
                style={styles.input}
                value={RePassword}
                onChangeText={setRePassword}
                placeholder="تکرار کلمه عبور"
                placeholderTextColor="#666"
                secureTextEntry
              />
            </View>

            {/* فیلد رمز عبور */}
            <View style={[styles.inputContainer, styles.halfInput, styles.leftMargin]}>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="کلمه عبور"
                placeholderTextColor="#666"
                secureTextEntry
              />
            </View>
          </View>

          {/* فیلد تاریخ تولد */}
          <TouchableOpacity
            style={styles.dateInputContainer}
            onPress={openDatePicker}>
            <Text style={[
              styles.dateInputText,
              persianBirthday ? styles.dateInputTextSelected : styles.dateInputTextPlaceholder
            ]}>
              {persianBirthday || 'تاریخ تولد'}
            </Text>
          </TouchableOpacity>

          {/* مودال DatePicker */}
          <Modal
            animationType="fade"
            transparent={true}
            visible={showDatePicker}
            onRequestClose={closeDatePicker}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={closeDatePicker}>
                    <Text style={styles.modalCloseText}>بستن</Text>
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>انتخاب تاریخ تولد</Text>
                  <TouchableOpacity onPress={() => {
                    handleDateChange(date);
                    closeDatePicker();
                  }}>
                    <Text style={styles.modalSubmitText}>تایید</Text>
                  </TouchableOpacity>
                </View>
                
                <DatePicker
                  mode="calendar"
                  minimumDate="1300/01/01"
                  maximumDate="1410/12/29"
                  onSelectedChange={()=>{}}
                  onMonthYearChange={()=>{}}
                  current={date}
                  selected={date}
                  onDateChange={handleDateChange}
                  isGregorian={false}
                  options={{
                    defaultFont: 'Shabnam-Light',
                    headerFont: 'Shabnam-Medium',
                    backgroundColor: '#FFFFFF',
                    textHeaderColor: '#333333',
                    textDefaultColor: '#333333',
                    selectedTextColor: '#FFFFFF',
                    mainColor: '#4CAF50',
                    textSecondaryColor: '#666666',
                    borderColor: '#E0E0E0',
                  }}
                  style={styles.datePicker}
                />
              </View>
            </View>
          </Modal>

          {/* دکمه ثبت‌نام */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleRegister}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.submitButtonText}>تایید و ورود</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* {isRegister && <ReferalLink sts={2} redirect={redirect} />} */}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#fff',
    marginBottom: 20,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  halfInput: {
    flex: 1,
  },
  rightMargin: {
    marginRight: 8,
  },
  leftMargin: {
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 50,
  },
  input: {
    flex: 1,
    fontSize: 16,
    textAlign: 'right',
    color: '#000',
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 12,
    height: 50,
    justifyContent: 'flex-start',
  },
  dateInputText: {
    flex: 1,
    fontSize: 16,
    textAlign: 'right',
  },
  dateInputTextSelected: {
    color: '#000',
  },
  dateInputTextPlaceholder: {
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#FEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#FCC',
  },
  errorText: {
    color: '#C00',
    textAlign: 'right',
  },
  formContainer: {
    width: '100%',
  },
  mobileText: {
    fontSize: 14,
    color: '#FFF',
    textAlign: 'right',
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#D9D9D9',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '500',
  },
  
  // استایل‌های مودال
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#666',
  },
  modalSubmitText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  datePicker: {
    borderRadius: 10,
    marginHorizontal: 10,
    marginTop: 10,
  },
});

// تابع تبدیل اعداد به فارسی (در صورت نیاز)
const toFarsiDigits = function (str) {
  return str.replace(/[0-9]/g, function (w) {
    var persian = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return persian[w];
  });
};

export default Register;