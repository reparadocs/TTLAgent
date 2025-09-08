import { z } from "zod";
import { PumpFunSDK } from "pumpdotfun-repumped-sdk";
import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider } from "@coral-xyz/anchor";
import SimpleWallet from "../utils/wallet.js";
import InjectMagicAPI from "../utils/api.js";

const sell = {
  name: "SELL_PUMPFUN_TOKEN",
  similes: [
    "sell pumpfun token",
    "exit pumpfun position",
    "sell memecoin",
    "sell pumpfun token",
  ],
  description:
    "Sell tokens on Pump.fun to receive SOL. You cannot sell more than you own and they are in normal units, not raw units.",
  examples: [
    [
      {
        input: {
          mintAddress: "ABC123...",
          sellAmount: "1000",
        },
        output: {
          status: "success",
          mintAddress: "ABC123...",
          sellAmount: "1000",
          solReceived: 0.06,
          signature: "XYZ789...",
        },
        explanation: "Successfully sold 1,000 ABC123... tokens for 0.06 SOL",
      },
    ],
  ],
  schema: z.object({
    mintAddress: z.string().describe("The mint address of the token to sell"),
    sellAmount: z.string().describe("Amount of tokens to sell (in raw units)"),
  }),
  handler: async (keypair, inputs) => {
    const { mintAddress, sellAmount } = inputs;

    let actionMessage = `Selling pump.fun token ${inputs.mintAddress} with ${inputs.sellAmount} tokens, result: `;
    try {
      console.log(mintAddress, sellAmount);

      const connection = new Connection(process.env.RPC_URL);
      const wallet = new SimpleWallet(keypair);
      const provider = new AnchorProvider(connection, wallet, {
        commitment: "finalized",
      });

      const initialSol = await connection.getBalance(wallet.publicKey);

      // Initialize PumpFun SDK
      const sdk = new PumpFunSDK(provider);

      // Convert mint address string to PublicKey
      const mint = new PublicKey(mintAddress);

      // Convert sell amount to bigint
      const sellAmountBigInt = BigInt(sellAmount * 1e6);

      // Sell the token
      const result = await sdk.trade.sell(
        keypair,
        mint,
        sellAmountBigInt,
        500n // 5% slippage
      );

      console.log("sell");

      console.log(result);

      if (result.success) {
        console.log(result.results.meta);
        console.log(result.results.meta.status);
        console.log(result.results.meta.logMessages);
        console.log(result.results.meta.preBalances);
        console.log(result.results.meta.postBalances);
        console.log(result.results.meta.preTokenBalances);
        console.log(result.results.meta.postTokenBalances);

        const finalSol = await connection.getBalance(wallet.publicKey);
        const solReceived = ((finalSol - initialSol) / 1e9).toFixed(9);

        actionMessage += "success. Received " + solReceived + " SOL";
        await InjectMagicAPI.postAction(actionMessage);
        return {
          status: "success",
          mintAddress: mintAddress,
          sellAmount: sellAmount,
          solReceived: solReceived,
          signature: result.signature,
        };
      } else {
        actionMessage += "failed";
        await InjectMagicAPI.postAction(actionMessage);
        return {
          status: "error",
          message: `Failed to sell token: ${result.error}`,
        };
      }
    } catch (error) {
      actionMessage += "failed";
      await InjectMagicAPI.postAction(actionMessage);
      return {
        status: "error",
        message: `Failed to sell token: ${error.message}`,
      };
    }
  },
};

export default sell;
