// components/MainPrompt.jsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';

import ModelFormNoneWallet from './ModelFormNoneWallet';
import ModelFormWallet from './ModelFormWallet';

const MainPrompt = ({ 
  ModelPageData, 
  ModelFormData, 
  onParentMsg, 
  ParentSideMenuState, 
  ParenHandleSideBar 
}) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set loading state
    setLoading(false);
  }, [ModelPageData, ModelFormData]);

  const renderPage = () => {
    // Check if we have form data (non-wallet)
    if (ModelFormData && Object.keys(ModelFormData).length > 0) {
      return (
        <ModelFormNoneWallet
          ModelFormData={ModelFormData}
          ModelPageData={ModelPageData}
          ParentSideMenuState={ParentSideMenuState}
          ParenHandleSideBar={ParenHandleSideBar}
        />
      );
    }
    
    // Check if we have wallet APIs
    else if (
      ModelPageData && 
      ModelPageData['wallet_apis'] && 
      Object.keys(ModelPageData['wallet_apis']).length > 0
    ) {
      return (

        <ModelFormWallet
          ModelFormData={ModelFormData}
          ModelPageData={ModelPageData}
          ParentSideMenuState={ParentSideMenuState}
          ParenHandleSideBar={ParenHandleSideBar}
        />
      );
    }
    
    // No data available
    else {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            داده‌ای برای نمایش وجود ندارد
          </Text>
        </View>
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>در حال بارگذاری...</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {renderPage()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff4444',
    textAlign: 'center',
  },
});

export default MainPrompt;