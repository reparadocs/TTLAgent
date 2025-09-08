import { z } from "zod";
import { PumpFunSDK } from "pumpdotfun-repumped-sdk";
import { Connection, Keypair } from "@solana/web3.js";
import { AnchorProvider } from "@coral-xyz/anchor";
import fs from "fs";
import path from "path";
import SimpleWallet from "../utils/wallet.js";
import InjectMagicAPI from "../utils/api.js";

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
          tokenDescription: "MyMemecoin is a memecoin that I want to launch",
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
    tokenDescription: z.string().describe("The description of the token"),
    buyAmountSol: z
      .string()
      .describe("Amount of SOL to spend buying the token"),
  }),
  handler: async (keypair, inputs) => {
    const { tokenName, tokenSymbol, tokenDescription, buyAmountSol } = inputs;

    let actionMessage = `Creating pump.fun token ${tokenName} with symbol ${tokenSymbol} and description ${tokenDescription} and buying it with ${buyAmountSol} SOL, result: `;
    try {
      // Create connection and provider
      const connection = new Connection(process.env.RPC_URL);
      const wallet = new SimpleWallet(keypair);
      const provider = new AnchorProvider(connection, wallet, {
        commitment: "finalized",
      });

      // Initialize PumpFun SDK
      const sdk = new PumpFunSDK(provider);

      // Generate new mint keypair for the token
      const mint = Keypair.generate();
      const imagePath = path.join(process.cwd(), "images", "mint.jpeg");

      // read the file into a buffer
      const data = fs.readFileSync(imagePath);

      // wrap it in a blob
      const blob = new Blob([data], { type: "image/png" });

      // Create token metadata
      const createTokenMetadata = {
        name: tokenName,
        symbol: tokenSymbol,
        description: tokenDescription,
        website: "https://rishabhegde.com", //TODO: change
        file: blob, // Include image as Blob if available
      };

      // Convert SOL amount to lamports (bigint)
      const buyAmountLamports = BigInt(
        Math.floor(parseFloat(buyAmountSol) * 1e9)
      );

      // Create and buy the token
      const result = await sdk.trade.createAndBuy(
        keypair, // Use keypair directly instead of wallet.keypair
        mint,
        createTokenMetadata,
        buyAmountLamports,
        500n // 5% slippage
      );

      if (result.success) {
        actionMessage += "success";
        await InjectMagicAPI.postAction(actionMessage);
        await InjectMagicAPI.whitelistToken(mint.publicKey.toBase58());

        return {
          status: "success",
          mintAddress: mint.publicKey.toBase58(),
          tokenName: tokenName,
          tokenSymbol: tokenSymbol,
          buyAmountSol: buyAmountSol,
          signature: result.signature,
        };
      } else {
        actionMessage += "error";
        await InjectMagicAPI.postAction(actionMessage);
        return {
          status: "failed",
          message: `Failed to create and buy token: ${result.error}`,
        };
      }
    } catch (error) {
      actionMessage += "error";
      await InjectMagicAPI.postAction(actionMessage);
      return {
        status: "failed",
        message: `Failed to create and buy token: ${error.message}`,
      };
    }
  },
};

export default createAndBuy;
