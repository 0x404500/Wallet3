import * as ethers from 'ethers';

import { INetwork, PublicNetworks } from '../common/Networks';
import { action, computed, makeObservable, observable, runInAction } from 'mobx';
import { getMaxPriorityFeeByRPC, getNextBlockBaseFeeByRPC } from '../common/RPC';
import ImageColors from 'react-native-image-colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Chain from '../models/Chain';
import Database from '../models/Database';
import icons from '../assets/icons/crypto';
import providers from '../configs/providers.json';
import { Any, In } from 'typeorm';

const ChainColors = {
  61: '#3ab83a',
};

export interface AddEthereumChainParameter {
  chainId: string; // A 0x-prefixed hexadecimal string
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string; // 2-6 characters long
    decimals: 18;
  };
  rpcUrls: string[];
  blockExplorerUrls?: string[];
  iconUrls?: string[]; // Currently ignored.
}

class Networks {
  current: INetwork = PublicNetworks[0];
  userChains: INetwork[] = [];

  get Ethereum() {
    return PublicNetworks[0];
  }

  get Optimism() {
    return PublicNetworks[2];
  }

  get Arbitrum() {
    return PublicNetworks[1];
  }

  get Polygon() {
    return PublicNetworks[3];
  }

  get all() {
    return PublicNetworks.concat(this.userChains);
  }

  constructor() {
    makeObservable(this, {
      current: observable,
      switch: action,
      reset: action,
      remove: action,
      userChains: observable,
      all: computed,
    });
  }

  async init() {
    const chains = await Database.chains.find();

    runInAction(() => {
      this.userChains = chains
        .filter((c) => !PublicNetworks.find((n) => n.chainId === Number(c.id)))
        .map<INetwork>((c) => {
          return {
            chainId: Number(c.id),
            color: c.customize?.color || '#7B68EE',
            comm_id: c.name.toLowerCase(),
            explorer: c.explorer,
            symbol: c.symbol,
            defaultTokens: [],
            network: c.name,
            rpcUrls: c.rpcUrls,
            eip1559: c.customize?.eip1559,
            isUserAdded: true,
          };
        });
    });

    AsyncStorage.getItem('network').then((chainId) => {
      const chain = Number(chainId || 1);
      runInAction(() => (this.current = this.all.find((n) => n.chainId === chain) || PublicNetworks[0]));
    });
  }

  switch(network: INetwork) {
    if (this.current === network) return;

    this.current = network;
    AsyncStorage.setItem('network', JSON.stringify(network.chainId));
  }

  has(chainId: number | string) {
    return this.all.some((n) => n.chainId === Number(chainId));
  }

  find(chainId: number | string) {
    return this.all.find((n) => n.chainId === Number(chainId));
  }

  async remove(chainId: number) {
    const chain = this.userChains.find((c) => c.chainId === chainId);
    if (!chain) return;

    this.userChains = this.userChains.filter((c) => c.chainId !== chainId);

    const userChain = await Database.chains.findOne({
      where: { id: In([`0x${chainId.toString(16)}`, `${chainId}`, chainId.toString(16)]) },
    });

    await userChain?.remove();
  }

  reset() {
    this.switch(this.Ethereum);
    this.userChains = [];
  }

  async add(chain: AddEthereumChainParameter) {
    if (!Number.isSafeInteger(Number(chain?.chainId))) return false;
    if (PublicNetworks.find((n) => n.chainId === Number(chain.chainId))) return false;
    if (chain.rpcUrls?.length === 0) return false;

    const nc = (await Database.chains.findOne({ where: { id: chain.chainId } })) || new Chain();

    nc.id = chain.chainId;
    nc.name = chain.chainName || 'EVM-Compatible';
    nc.explorer = chain.blockExplorerUrls?.[0] || '';
    nc.rpcUrls = chain.rpcUrls;
    nc.customize = nc.customize ?? { color: ChainColors[Number(chain.chainId)] || '#7B68EE', eip1559: false };
    nc.symbol = chain.nativeCurrency.symbol || 'ETH';

    try {
      const priFee = await getNextBlockBaseFeeByRPC(chain.rpcUrls[0]);
      nc.customize.eip1559 = priFee >= 1;

      const icon = icons[nc.symbol.toLowerCase()];

      if (icon) {
        const result = await ImageColors.getColors(icon);
        switch (result.platform) {
          case 'android':
            nc.customize.color = result.dominant || nc.customize.color;
            break;
          case 'ios':
            nc.customize.color = result.background || nc.customize.color;
            break;
        }
      }
    } catch (error) {}

    runInAction(() => {
      this.userChains.push({
        chainId: Number(chain.chainId),
        color: nc.customize!.color!,
        network: nc.name,
        comm_id: nc.symbol.toLowerCase(),
        defaultTokens: [],
        explorer: nc.explorer,
        symbol: nc.symbol,
        rpcUrls: chain.rpcUrls,
        eip1559: nc.customize?.eip1559,
        isUserAdded: true,
      });
    });

    await nc.save();

    return true;
  }

  async update(network: INetwork) {
    const value = this.find(network.chainId);
    if (!value || !value.isUserAdded) return;

    value.symbol = network.symbol;
    value.explorer = network.explorer;
    value.color = network.color;
    value.rpcUrls = network.rpcUrls;

    const userChain = await Database.chains.findOne({
      where: { id: In([`0x${value.chainId.toString(16)}`, `${value.chainId}`, value.chainId.toString(16)]) },
    });

    if (!userChain) return;
    userChain.customize!.color = network.color;
    userChain.explorer = network.explorer;
    userChain.rpcUrls = network.rpcUrls || [];
    userChain.symbol = network.symbol;
    userChain.save();
  }

  get MainnetWsProvider() {
    const [ws] = providers['1'] as string[];
    const provider = new ethers.providers.WebSocketProvider(ws, 1);

    return provider;
  }
}

export default new Networks();
