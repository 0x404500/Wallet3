import { Dimensions, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import DAppsScreen from './dapps';
import Drawer from './home/Drawer';
import HomeScreen from './home/root';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import PortfolioScreen from './portfolio';
import React from 'react';
import SettingScreen from './settings';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { fontColor } from '../constants/styles';
import i18n from '../i18n';
import { observer } from 'mobx-react-lite';

const DrawerRoot = createDrawerNavigator();
const ScreenWidth = Dimensions.get('window').width;

type RootStackParamList = {
  Home: undefined;
  QRScan: undefined;
  Portfolio: undefined;
};

export default observer(({ navigation }: NativeStackScreenProps<RootStackParamList, 'Home'>) => {
  const { Navigator, Screen } = DrawerRoot;
  const { t } = i18n;

  return (
    <Navigator
      initialRouteName="Home"
      drawerContent={Drawer}
      screenOptions={{
        headerTransparent: false,
        headerTintColor: fontColor,
        swipeEdgeWidth: ScreenWidth * 0.37,
        drawerType: 'slide',
      }}
    >
      <Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Wallet 3',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('QRScan')}
              style={{
                zIndex: 5,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
                paddingStart: 8,
                paddingEnd: 2,
                marginEnd: 17,
              }}
            >
              <MaterialCommunityIcons name="scan-helper" size={18} style={{}} />
              <View
                style={{ position: 'absolute', left: 2, right: 4.5, height: 1.5, backgroundColor: '#000', marginStart: 8 }}
              />
            </TouchableOpacity>
          ),
        }}
      />

      <Screen name="Settings" component={SettingScreen} options={{ title: t('home-drawer-settings') }} />
      <Screen name="DApps" component={DAppsScreen} options={{ title: t('connectedapps-title') }} />

      <Screen
        name="Portfolio"
        component={PortfolioScreen}
        options={{ headerTransparent: true, headerTitleStyle: { display: 'none' } }}
      />

     
    </Navigator>
  );
});
