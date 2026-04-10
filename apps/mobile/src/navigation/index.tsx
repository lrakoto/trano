import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { HomeScreen } from '../screens/HomeScreen';
import { ListingDetailScreen } from '../screens/ListingDetailScreen';
import { PostListingScreen } from '../screens/PostListingScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { COLORS } from '../constants';

// ─── Param lists ──────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Tabs:          undefined;
  ListingDetail: { listingId: string };
  PostListing:   undefined;
  // Auth screens presented as modals so browsing context is preserved
  Login:         undefined;
  Register:      undefined;
};

export type TabParamList = {
  Home:    undefined;
  Profile: undefined;
};

// ─── Navigators ───────────────────────────────────────────────────────────────

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab   = createBottomTabNavigator<TabParamList>();

function TabNavigator() {
  return (
    <Tab.Navigator screenOptions={{ tabBarActiveTintColor: COLORS.primary }}>
      <Tab.Screen name="Home"    component={HomeScreen}    options={{ headerShown: false, title: 'Trano' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profily' }} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator>
      {/* App screens — always accessible */}
      <Stack.Screen name="Tabs"          component={TabNavigator}        options={{ headerShown: false }} />
      <Stack.Screen name="ListingDetail" component={ListingDetailScreen} options={{ title: 'Antsipirihany' }} />
      <Stack.Screen name="PostListing"   component={PostListingScreen}   options={{ title: 'Manampy lisitra' }} />
      {/* Auth screens — presented modally so user can dismiss back to browsing */}
      <Stack.Screen name="Login"    component={LoginScreen}    options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ presentation: 'modal', headerShown: false }} />
    </Stack.Navigator>
  );
}
