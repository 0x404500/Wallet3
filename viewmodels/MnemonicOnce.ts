import * as Random from 'expo-random';
import * as ethers from 'ethers';

import { decrypt, encrypt } from '../utils/cipher';

import Authentication from './Authentication';
import { DEFAULT_DERIVATION_PATH } from '../common/Constants';
import Key from '../models/Key';
import { langToWordlist } from '../utils/mnemonic';
import { makeAutoObservable } from 'mobx';
import { setString } from 'expo-clipboard';
import { xpubkeyFromHDNode } from '../utils/bip32';

export class MnemonicOnce {
  secret = '';
  derivationPath = DEFAULT_DERIVATION_PATH;
  derivationIndex = 0;

  get secretWords() {
    return this.secret.split(/\s/);
  }

  constructor() {
    makeAutoObservable(this);
  }

  async generate(length: 12 | 24 = 12) {
    const entropy = Random.getRandomBytes(length === 12 ? 16 : 32);
    this.secret = ethers.utils.entropyToMnemonic(entropy);
  }

  setMnemonic(mnemonic: string) {
    if (!ethers.utils.isValidMnemonic(mnemonic, langToWordlist(mnemonic))) return false;
    
    this.secret = mnemonic;
    setString(''); // write empty string to clipboard, if the user pasted a mnemonic
    return true;
  }

  async setDerivationPath(fullPath: string) {
    if (!fullPath.startsWith('m/')) return;
    const lastSlash = fullPath.lastIndexOf('/');
    this.derivationPath = fullPath.substring(0, lastSlash) || DEFAULT_DERIVATION_PATH;
    this.derivationIndex = Number.parseInt(fullPath.substring(lastSlash + 1)) || 0;
  }

  async save() {
    const root = ethers.utils.HDNode.fromMnemonic(this.secret);
    const bip32 = root.derivePath(this.derivationPath);
    const bip32XPubkey = xpubkeyFromHDNode(bip32);

    const key = new Key();
    key.id = Date.now();
    key.secret = await Authentication.encrypt(this.secret);
    key.bip32Xprivkey = await Authentication.encrypt(bip32.extendedKey);
    key.bip32Xpubkey = bip32XPubkey;
    key.basePath = this.derivationPath;
    key.basePathIndex = this.derivationIndex;

    await key.save();

    this.clean();

    return key;
  }

  clean() {
    this.secret = '';
  }
}

export default new MnemonicOnce();
