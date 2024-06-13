import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import moment from 'moment';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import io from 'socket.io-client';

import { useColorScheme } from '@/hooks/useColorScheme';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const colorScheme = useColorScheme();
  const [metano, setMetano] = useState(0);
  const [color, setColor] = useState('#00FF00');
  const [greeting, setGreeting] = useState('');
  const socket = io('https://api-gas.onrender.com');

  useEffect(() => {
    registerForPushNotificationsAsync();
    updateGreeting();
    connectToSocket();
  }, []);

  const connectToSocket = () => {
    socket.on('connect', () => {
      console.log('Connected to server');
    });

    socket.on('mqtt_message', handleMessage);
    socket.on('connect_error', handleConnectError);
  };

  const handleMessage = (message : any) => {
    console.log("Message received: ", message)
    setMetano(message);
    setColor(getColorByMetanoLevel(message));
    sendNotification(message);
  };

  const handleConnectError = (error : any) => {
    console.error('Socket connection error:', error.message);
    Alert.alert('Connection Error', 'Failed to connect to server.');
  };

  const getColorByMetanoLevel = (level:number) => {
    if (level < 200) return '#00FF00'; // Verde
    if (level < 350) return '#FFFF00'; // Amarillo
    return '#FF0000'; // Rojo
  };

  const sendNotification = async (nivelMetano : any) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Nivel de Metano',
        body: `El nivel de metano es ${nivelMetano} ppm.`,
      },
      trigger: null,
    });
  };

  const updateGreeting = () => {
    const hour = moment().hour();
    if (hour < 12) {
      setGreeting('Good Morning');
    } else if (hour < 18) {
      setGreeting('Good Afternoon');
    } else if (hour < 21) {
      setGreeting('Good Evening');
    } else {
      setGreeting('Good Night');
    }
  };

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="weather-sunny" size={50} color="#FFD700" />
          <Text style={styles.greeting}>{greeting}</Text>
        </View>
        <View style={[styles.box, { backgroundColor: color }]}>
          <MaterialCommunityIcons name="gas-cylinder" size={100} color="#FFFFFF" />
          <Text style={styles.text}>{metano} ppm</Text>
        </View>
      </SafeAreaView>
    </ThemeProvider>
  );
}

async function registerForPushNotificationsAsync() {
  if (!Constants.isDevice) {
    Alert.alert('Not a Device', 'Must use physical device for Push Notifications.');
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    Alert.alert('Permission Denied', 'Failed to get push token for push notification!');
    return;
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  console.log(token);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    marginLeft: 10,
    color: '#333',
  },
  box: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 200,
    height: 200,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  text: {
    fontSize: 30,
    color: '#FFFFFF',
    marginTop: 10,
  },
});
