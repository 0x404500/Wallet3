import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { ListRenderItemInfo, Text, TextInput, TouchableHighlight, TouchableOpacity, View } from 'react-native';
import React, { useRef, useState } from 'react';
import { SafeViewContainer, TextBox } from '../../components';
import { borderColor, fontColor, secondaryFontColor } from '../../constants/styles';

import Button from '../../components/Button';
import { FlatList } from 'react-native-gesture-handler';
import { formatAddress } from '../../utils/formatter';
import styles from '../styles';

const data = [
  'rsa.eth',
  'vitalik.eth',
  '0x00192Fb10dF37c9FB26829eb2CC623cd1BF599E8',
  'pixlpa.eth',
  '0x1B99d91C3416bD3e6E6dc75d81ABfD360e7733F3',
  'solemnstranger.eth',
  '0xd24400ae8BfEBb18cA49Be86258a3C749cf46853',
  '0x96a29A8B1F9dC2546D5995874d23630B27E0b9d7',
  'mangimi.eth',
];

interface Props {
  onNext?: () => void;
}

export default (props: Props) => {
  const [addr, setAddr] = useState('');

  const renderAddress = ({ item }: ListRenderItemInfo<string>) => {
    return (
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 0,
          margin: 0,
          paddingVertical: 10,
        }}
        onPress={(_) => setAddr(item)}
      >
        <FontAwesome name="user-circle-o" size={20} color={secondaryFontColor} style={{ opacity: 0.5, marginEnd: 12 }} />
        <Text style={{ fontSize: 17, color: fontColor }} numberOfLines={1}>
          {formatAddress(item)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeViewContainer style={styles.container}>
      <TextBox
        title="To:"
        onChangeText={(t) => {
          setAddr(t);
        }}
        value={addr}
      />

      <Text style={{ color: secondaryFontColor }}>Recent contacts:</Text>

      <FlatList
        data={data}
        renderItem={renderAddress}
        style={{ flex: 1, marginHorizontal: -16, paddingHorizontal: 16 }}
        keyExtractor={(item) => item}
        ItemSeparatorComponent={() => <View style={{ backgroundColor: borderColor, height: 1 }} />}
      />

      <Button title="Next" style={{ marginTop: 12 }} onPress={props.onNext} />
    </SafeViewContainer>
  );
};
