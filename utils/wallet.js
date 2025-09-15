import { Connection } from "@solana/web3.js";

class SimpleWallet {
  constructor(payer) {
    this.payer = payer;
    this.connection = new Connection(process.env.RPC_URL);
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

  async getRawBalance() {
    const balance = await this.connection.getBalance(this.publicKey);
    return balance;
  }

  async getBalance() {
    const balance = await this.getRawBalance();
    return balance / 1e9;
  }

  async getTokenBalance(mint) {
    const balance = await this.connection.getTokenAccountsByOwner(
      this.publicKey,
      {
        mint,
      }
    );
    console.log(balance.value[0].account);
    const ret = balance.value[0].account.data.parsed.info.tokenAmount.uiAmount;
    console.log(ret);
    return ret;
  }
}

export default SimpleWallet;
