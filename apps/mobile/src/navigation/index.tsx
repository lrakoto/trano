import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { HomeScreen } from '../screens/HomeScreen';
import { SavedScreen } from '../screens/SavedScreen';
import { CitiesScreen } from '../screens/CitiesScreen';
import { InboxScreen } from '../screens/InboxScreen';
import { ListingDetailScreen } from '../screens/ListingDetailScreen';
import { PostListingScreen } from '../screens/PostListingScreen';
import { MyListingsScreen } from '../screens/MyListingsScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { COLORS } from '../constants';

// ─── Param lists ──────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Tabs:          undefined;
  ListingDetail: { listingId: string };
  PostListing:   { listingId?: string } | undefined;
  MyListings:    undefined;
  Login:         undefined;
  Register:      undefined;
};

export type TabParamList = {
  Home:   { cityFilter?: string } | undefined;
  Saved:  undefined;
  Cities: undefined;
  Inbox:  undefined;
};

// ─── Tab icons ────────────────────────────────────────────────────────────────

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<keyof TabParamList, { active: IoniconsName; inactive: IoniconsName }> = {
  Home:   { active: 'compass',       inactive: 'compass-outline' },
  Saved:  { active: 'heart',        inactive: 'heart-outline' },
  Cities: { active: 'location',     inactive: 'location-outline' },
  Inbox:  { active: 'chatbubble',   inactive: 'chatbubble-outline' },
};

const TAB_LABELS: Record<keyof TabParamList, string> = {
  Home:   'Fandraisana',
  Saved:  'Voatahiry',
  Cities: 'Tanàna',
  Inbox:  'Hafatra',
};

// ─── Navigators ───────────────────────────────────────────────────────────────

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab   = createBottomTabNavigator<TabParamList>();

function TabNavigator() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor:   COLORS.primaryMid,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor:   COLORS.surface,
          borderTopColor:    COLORS.border,
          height:             38 + insets.bottom,
          paddingBottom:      Math.max(0, insets.bottom - 8),
          paddingTop:         6,
          paddingHorizontal:  4,
        },
        tabBarLabelStyle: {
          fontSize:   10,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color }) => {
          const icons = TAB_ICONS[route.name as keyof TabParamList];
          return (
            <Ionicons
              name={focused ? icons.active : icons.inactive}
              size={22}
              color={color}
            />
          );
        },
        tabBarLabel: TAB_LABELS[route.name as keyof TabParamList],
      })}
    >
      <Tab.Screen name="Home"   component={HomeScreen} />
      <Tab.Screen name="Saved"  component={SavedScreen} />
      <Tab.Screen name="Cities" component={CitiesScreen} />
      <Tab.Screen name="Inbox"  component={InboxScreen} />
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
      <Stack.Screen name="Tabs"          component={TabNavigator}        options={{ headerShown: false }} />
      <Stack.Screen
        name="ListingDetail"
        component={ListingDetailScreen}
        options={{
          title: 'Antsipirihany',
          headerBackTitle: 'Hiverina',
          headerBackTitleStyle: { fontSize: 13 },
        }}
      />
      <Stack.Screen name="PostListing"   component={PostListingScreen}   options={{ title: 'Manampy lisitra' }} />
      <Stack.Screen name="MyListings"    component={MyListingsScreen}    options={{ headerShown: false }} />
      <Stack.Screen name="Login"    component={LoginScreen}    options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ presentation: 'modal', headerShown: false }} />
    </Stack.Navigator>
  );
}
