import { ethers } from "ethers";

class ElvWallet {
  constructor() {
    this.signers = {};
  }

  async AddAccountFromEncryptedPK({ accountName, encryptedPrivateKey, password }) {
    let signer = await ethers.Wallet.fromEncryptedJson(encryptedPrivateKey, password);
    this.signers[accountName] = signer;
    return signer;
  }

  AddAccount({ accountName, privateKey }) {
    let signer = new ethers.Wallet(privateKey);
    this.signers[accountName] = signer;
    return signer;
  }

  GetAccount({ accountName }) {
    return this.signers[accountName];
  }

  RemoveAccount({ accountName }) {
    delete this.signers[accountName];
  }
}

export default ElvWallet;
