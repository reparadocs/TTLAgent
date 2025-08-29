import { z } from "zod";
import { PumpFunSDK } from "pumpdotfun-sdk";
import { Connection, Keypair } from "@solana/web3.js";
import { AnchorProvider } from "@coral-xyz/anchor";

const createAndBuy = {
  name: "LAUNCH_PUMPFUN_TOKEN",
  similes: ["launch pumpfun token", "start memecoin", "start new token"],
  description:
    "Create a new token on Pump.fun and buy it with SOL. This launches a new memecoin that you can trade.",
  examples: [
    [
      {
        input: {
          tokenName: "MyMemecoin",
          tokenSymbol: "MEME",
          buyAmountSol: "0.1",
        },
        output: {
          status: "success",
          mintAddress: "ABC123...",
          tokenName: "MyMemecoin",
          tokenSymbol: "MEME",
          buyAmountSol: "0.1",
          signature: "XYZ789...",
        },
        explanation:
          "Successfully created and bought a new token called MyMemecoin",
      },
    ],
  ],
  schema: z.object({
    tokenName: z.string().describe("The name of the token to create"),
    tokenSymbol: z.string().describe("The symbol/ticker of the token"),
    buyAmountSol: z
      .string()
      .describe("Amount of SOL to spend buying the token"),
  }),
  handler: async (wallet, inputs) => {
    try {
      const { tokenName, tokenSymbol, buyAmountSol } = inputs;

      // Create connection and provider
      const connection = new Connection(
        process.env.RPC_URL || "https://api.mainnet-beta.solana.com"
      );
      const provider = new AnchorProvider(connection, wallet, {
        commitment: "confirmed",
      });

      // Initialize PumpFun SDK
      const sdk = new PumpFunSDK(provider);

      // Generate new mint keypair for the token
      const mint = Keypair.generate();

      // Create token metadata
      const createTokenMetadata = {
        name: tokenName,
        symbol: tokenSymbol,
        uri: "", // Optional metadata URI
      };

      // Convert SOL amount to lamports (bigint)
      const buyAmountLamports = BigInt(
        Math.floor(parseFloat(buyAmountSol) * 1e9)
      );

      // Create and buy the token
      const result = await sdk.createAndBuy(
        wallet.keypair,
        mint,
        createTokenMetadata,
        buyAmountLamports,
        500n, // 5% slippage
        undefined, // No priority fees
        "confirmed",
        "confirmed"
      );

      if (result.success) {
        return {
          status: "success",
          mintAddress: mint.publicKey.toBase58(),
          tokenName: tokenName,
          tokenSymbol: tokenSymbol,
          buyAmountSol: buyAmountSol,
          signature: result.signature,
        };
      } else {
        return {
          status: "error",
          message: `Failed to create and buy token: ${result.error}`,
        };
      }
    } catch (error) {
      return {
        status: "error",
        message: `Failed to create and buy token: ${error.message}`,
      };
    }
  },
};

export default createAndBuy;
