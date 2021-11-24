import { Button, Mnemonic, SafeViewContainer } from '../../components';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, Text, View } from 'react-native';
import { secondaryFontColor, styles } from '../../constants/styles';

import App from '../../viewmodels/App';
import Authentication from '../../viewmodels/Authentication';
import { FullPasspad } from '../../modals/views/Passpad';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MnemonicOnce from '../../viewmodels/MnemonicOnce';
import { Modalize } from 'react-native-modalize';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Networks from '../../viewmodels/Networks';
import { Portal } from 'react-native-portalize';
import i18n from '../../i18n';
import { observer } from 'mobx-react-lite';
import { useModalize } from 'react-native-modalize/lib/utils/use-modalize';

export default observer(({ navigation }: NativeStackScreenProps<any, never>) => {
  const { t } = i18n;
  const { ref: authModalRef, open, close } = useModalize();
  const [retried, setRetried] = useState(0);
  const [authorized, setAuthorized] = useState(false);
  const [words, setWords] = useState<string[]>([]);

  const themeColor = Networks.current.color;

  const verify = async (passcode?: string) => {
    const secret = await App.currentWallet?.getSecret(passcode);
    const success = secret ? true : false;

    setAuthorized(success);

    try {
      if (success) {
        close();
        MnemonicOnce.setMnemonic(secret!);
        setWords(MnemonicOnce.secretWords);
      } else {
        setRetried((p) => p + 1);
      }

      return success;
    } finally {
      if (retried > 3) navigation.pop();
    }
  };

  useEffect(() => {
    setTimeout(() => open(), 0);
    if (Authentication.biometricsEnabled) verify();

    return () => MnemonicOnce.clean();
  }, []);

  return (
    <SafeViewContainer style={{ backgroundColor: '#fff' }} paddingHeader includeTopPadding>
      {authorized ? (
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: -12, marginBottom: -8 }}>
            <MaterialCommunityIcons name="shield-key" size={64} color={'#61D800'} />
          </View>

          <View style={{ marginVertical: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '500', color: themeColor, marginBottom: 8 }}>
              {t('land-create-security-tips')}
            </Text>
            <Text style={{ marginStart: 16, marginBottom: 8, color: secondaryFontColor }}>
              {t('land-create-security-tips-1')}
            </Text>
            <Text style={{ marginStart: 16, color: secondaryFontColor }}>{t('land-create-security-tips-2')}</Text>
          </View>

          <Mnemonic phrase={words} />

          <View style={{ flex: 1 }} />

          <Button
            title={t('settings-security-backup-button-verify')}
            themeColor={themeColor}
            onPress={() => navigation.navigate('VerifySecret')}
          />
        </View>
      ) : (
        <View></View>
      )}

      <Portal>
        <Modalize
          ref={authModalRef}
          disableScrollIfPossible
          adjustToContentHeight
          closeOnOverlayTap={false}
          withHandle={false}
          panGestureEnabled={false}
          panGestureComponentEnabled={false}
          modalStyle={styles.modalStyle}
          scrollViewProps={{ showsVerticalScrollIndicator: false, scrollEnabled: false }}
        >
          <FullPasspad themeColor={themeColor} height={420} onCodeEntered={(code) => verify(code)} />
        </Modalize>
      </Portal>
    </SafeViewContainer>
  );
});
