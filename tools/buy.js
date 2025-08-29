import { z } from "zod";
import { PumpFunSDK } from "pumpdotfun-sdk";
import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider } from "@coral-xyz/anchor";

const buy = {
  name: "BUY_PUMPFUN_TOKEN",
  similes: ["buy pumpfun token", "buy memecoin"],
  description:
    "Buy an existing token on Pump.fun using SOL. This allows you to invest in memecoins and build your position.",
  examples: [
    [
      {
        input: {
          mintAddress: "ABC123...",
          buyAmountSol: "0.05",
        },
        output: {
          status: "success",
          mintAddress: "ABC123...",
          buyAmountSol: "0.05",
          tokensReceived: "1000000",
          signature: "XYZ789...",
        },
        explanation: "Successfully bought tokens with 0.05 SOL",
      },
    ],
  ],
  schema: z.object({
    mintAddress: z.string().describe("The mint address of the token to buy"),
    buyAmountSol: z
      .string()
      .describe("Amount of SOL to spend buying the token"),
  }),
  handler: async (wallet, inputs) => {
    try {
      const { mintAddress, buyAmountSol } = inputs;

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

      // Convert SOL amount to lamports (bigint)
      const buyAmountLamports = BigInt(
        Math.floor(parseFloat(buyAmountSol) * 1e9)
      );

      // Buy the token
      const result = await sdk.buy(
        wallet.keypair,
        mint,
        buyAmountLamports,
        500n, // 5% slippage
        undefined, // No priority fees
        "confirmed",
        "confirmed"
      );

      if (result.success) {
        return {
          status: "success",
          mintAddress: mintAddress,
          buyAmountSol: buyAmountSol,
          tokensReceived: result.tokensReceived?.toString() || "0",
          signature: result.signature,
        };
      } else {
        return {
          status: "error",
          message: `Failed to buy token: ${result.error}`,
        };
      }
    } catch (error) {
      return {
        status: "error",
        message: `Failed to buy token: ${error.message}`,
      };
    }
  },
};

export default buy;
