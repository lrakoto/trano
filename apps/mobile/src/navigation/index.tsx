import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/HomeScreen';
import { ListingDetailScreen } from '../screens/ListingDetailScreen';
import { PostListingScreen } from '../screens/PostListingScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { COLORS } from '../constants';

export type RootStackParamList = {
  Tabs:          undefined;
  ListingDetail: { listingId: string };
  PostListing:   undefined;
};

export type TabParamList = {
  Home:    undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab   = createBottomTabNavigator<TabParamList>();

function TabNavigator() {
  return (
    <Tab.Navigator screenOptions={{ tabBarActiveTintColor: COLORS.primary }}>
      <Tab.Screen name="Home"    component={HomeScreen}    options={{ title: 'Trano' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profily' }} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Tabs"          component={TabNavigator}         options={{ headerShown: false }} />
      <Stack.Screen name="ListingDetail" component={ListingDetailScreen}  options={{ title: 'Antsipirihany' }} />
      <Stack.Screen name="PostListing"   component={PostListingScreen}    options={{ title: 'Manampy lisitra' }} />
    </Stack.Navigator>
  );
}
