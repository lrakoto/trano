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
};

export type TabParamList = {
  Home:    undefined;
  Profile: undefined;
};

export type AuthStackParamList = {
  Login:    undefined;
  Register: undefined;
};

// ─── Navigators ───────────────────────────────────────────────────────────────

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab       = createBottomTabNavigator<TabParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

function TabNavigator() {
  return (
    <Tab.Navigator screenOptions={{ tabBarActiveTintColor: COLORS.primary }}>
      <Tab.Screen name="Home"    component={HomeScreen}    options={{ title: 'Trano' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profily' }} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  return (
    <RootStack.Navigator>
      <RootStack.Screen name="Tabs"          component={TabNavigator}        options={{ headerShown: false }} />
      <RootStack.Screen name="ListingDetail" component={ListingDetailScreen} options={{ title: 'Antsipirihany' }} />
      <RootStack.Screen name="PostListing"   component={PostListingScreen}   options={{ title: 'Manampy lisitra' }} />
    </RootStack.Navigator>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login"    component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

// ─── Root: shows auth or app depending on login state ─────────────────────────

export function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return user ? <AppNavigator /> : <AuthNavigator />;
}
