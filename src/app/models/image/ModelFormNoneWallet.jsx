// components/FormBaseModel.jsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import DynamicFormNoneWallet from './DynamicFormNoneWallet';

const FormBaseModel = ({ 
  ModelFormData, 
  ModelPageData, 
  ParentSideMenuState, 
  ParenHandleSideBar 
}) => {
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="dark-content"
        backgroundColor="#f5f5f5"
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <DynamicFormNoneWallet
            ModelFormData={ModelFormData}
            ModelPageData={ModelPageData}
            ParentSideMenuState={ParentSideMenuState}
            ParenHandleSideBar={ParenHandleSideBar}
          />
        </View>
      </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingVertical: 16,
  },
});

export default FormBaseModel;