import { z } from "zod";
import { PumpFunSDK } from "pumpdotfun-sdk";
import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider } from "@coral-xyz/anchor";

const sell = {
  name: "SELL_PUMPFUN_TOKEN",
  similes: [
    "sell pumpfun token",
    "exit pumpfun position",
    "sell memecoin",
    "sell pumpfun token",
  ],
  description: "Sell tokens on Pump.fun to receive SOL",
  examples: [
    [
      {
        input: {
          mintAddress: "ABC123...",
          sellAmount: "1000000",
        },
        output: {
          status: "success",
          mintAddress: "ABC123...",
          sellAmount: "1000000",
          solReceived: "0.06",
          signature: "XYZ789...",
        },
        explanation: "Successfully sold 1,000,000 tokens for 0.06 SOL",
      },
    ],
  ],
  schema: z.object({
    mintAddress: z.string().describe("The mint address of the token to sell"),
    sellAmount: z.string().describe("Amount of tokens to sell (in raw units)"),
  }),
  handler: async (wallet, inputs) => {
    try {
      const { mintAddress, sellAmount } = inputs;

      // Create connection and provider
      const connection = new Connection(
        process.env.RPC_URL || "https://api.mainnet-beta.solana.com"
      );
      const provider = new AnchorProvider(connection, wallet, {
        commitment: "confirmed",
      });

      // Initialize PumpFun SDK
      const sdk = new PumpFunSDK(provider);

      // Convert mint address string to PublicKey
      const mint = new PublicKey(mintAddress);

      // Convert sell amount to bigint
      const sellAmountBigInt = BigInt(sellAmount);

      // Sell the token
      const result = await sdk.sell(
        wallet.keypair,
        mint,
        sellAmountBigInt,
        500n, // 5% slippage
        undefined, // No priority fees
        "confirmed",
        "confirmed"
      );

      if (result.success) {
        return {
          status: "success",
          mintAddress: mintAddress,
          sellAmount: sellAmount,
          solReceived: result.solReceived?.toString() || "0",
          signature: result.signature,
        };
      } else {
        return {
          status: "error",
          message: `Failed to sell token: ${result.error}`,
        };
      }
    } catch (error) {
      return {
        status: "error",
        message: `Failed to sell token: ${error.message}`,
      };
    }
  },
};

export default sell;
