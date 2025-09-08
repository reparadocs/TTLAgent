import { Keypair, Transaction } from "@solana/web3.js";

class SimpleWallet {
  constructor(payer) {
    this.payer = payer;
  }

  get publicKey() {
    return this.payer.publicKey;
  }

  async signTransaction(tx) {
    tx.partialSign(this.payer);
    return tx;
  }

  async signAllTransactions(txs) {
    txs.forEach((tx) => tx.partialSign(this.payer));
    return txs;
  }
}

export default SimpleWallet;
