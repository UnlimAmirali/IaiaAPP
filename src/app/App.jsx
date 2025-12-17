// App.jsx
import React, { useEffect } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createMMKV } from 'react-native-mmkv';

import Models from './models/page';
import Login from './login/page'
import { AppProvider } from './context/AppContext'; 

const storage = new createMMKV();
const Stack = createNativeStackNavigator();


function LoginScreen({ navigation }) {
  return <Login />;
}

function HomeScreen({ navigation }) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text>Home</Text>

      <Button
        title="Test MMKV"
        onPress={() => {
          storage.set('test', 'testValue');
          const value = storage.getString('test');
          Alert.alert('MMKV', value ?? 'NULL');
        }}
      />

      <Button
        title="Go to Models"
        onPress={() => navigation.navigate('Models')}
      />
      <Button
        title="Go to Login"
        onPress={() => navigation.navigate('Login')}
      />

      <Button 
        title='Gt to model with slug'
        onPress={() => navigation.navigate('Models', {
          slug:"slugAmirali",
        })}
        />
    </View>
  );
}

function DetailsScreen({ navigation }) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text>Details Screen</Text>

      <Button
        title="Go to Details again"
        onPress={() => navigation.push('Details')}
      />

      <Button
        title="Go back"
        onPress={() => navigation.goBack()}
      />
    </View>
  );
}

function ModelsScreen() {
  return <Models />;
}

function AppInner() {

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
      <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Details"
          component={DetailsScreen}
        />
        <Stack.Screen
          name="Models"
          component={ModelsScreen}
          // options={{ headerShown: false }}
          options={({ route }) => ({
            // title: route.params?.title || 'صفحه داینامیک',
            // headerBackTitle: 'بازگشت',
            headerShown: false 
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  useEffect(() => {
    storage.set('boot', 'launched');
    console.log('MMKV boot:', storage.getString('boot'));
  }, []);

  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}