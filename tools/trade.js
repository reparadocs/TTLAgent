import { z } from "zod";

const tradeTokens = {
  name: "TRADE_TOKENS",
  similes: ["trade tokens", "buy tokens", "sell tokens", "swap tokens"],
  description:
    "Trade tokens on the solana blockchain using Jupiter. You can swap tokens for other tokens at current market price.",
  examples: [
    [
      {
        input: {
          inputMint: "So11111111111111111111111111111111111111112",
          outputMint: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
          inputAmount: "0.1",
        },
        output: {
          status: "success",
          inputMint: "So11111111111111111111111111111111111111112",
          inputAmount: "0.1",
          outputMint: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
          outputAmount: "1274698",
        },
        explanation: "Swap 0.1 SOL for 1274698 WIF",
      },
    ],
  ],
  schema: z.object({
    inputMint: z
      .string()
      .describe("The token mint address of the token you want to swap"),
    outputMint: z
      .string()
      .describe("The token mint address of the token you want to swap to"),
    inputAmount: z
      .string()
      .describe(
        "The amount of the input token to swap (in SOL for SOL, or raw units for other tokens)"
      ),
  }),
  handler: async (wallet, inputs) => {
    try {
      const { inputMint, outputMint, inputAmount } = inputs;

      // Convert SOL amounts to lamports if input is SOL
      let amountToSend = inputAmount;
      if (inputMint === "So11111111111111111111111111111111111111112") {
        // Convert SOL to lamports
        amountToSend = (parseFloat(inputAmount) * 1e9).toString();
      }

      // Step 1: Generate order using Jupiter API
      const orderResponse = await fetch("https://api.jup.ag/ultra/v1/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.JUPITER_API_KEY || "",
        },
        body: JSON.stringify({
          inputMint,
          outputMint,
          amount: amountToSend,
          taker: wallet.publicKey.toBase58(),
        }),
      });

      if (!orderResponse.ok) {
        throw new Error(`Jupiter order API error: ${orderResponse.status}`);
      }

      const orderData = await orderResponse.json();
      const { transaction, requestId } = orderData;

      if (!transaction || !requestId) {
        throw new Error("Invalid response from Jupiter order API");
      }

      const signedTransaction = await wallet.signTransaction(transaction);

      // Step 2: Execute the order with signed transaction
      const executeResponse = await fetch(
        "https://api.jup.ag/ultra/v1/execute",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.JUPITER_API_KEY || "",
          },
          body: JSON.stringify({
            signedTransaction,
            requestId,
          }),
        }
      );

      if (!executeResponse.ok) {
        throw new Error(`Jupiter execute API error: ${executeResponse.status}`);
      }

      const executeData = await executeResponse.json();
      if (executeData.status === "success") {
        // Return the results in the expected format
        return {
          status: "success",
          inputMint: inputMint,
          inputAmount: inputAmount, // Return original user input
          outputMint: outputMint,
          outputAmount: executeData.outputAmountResult,
        };
      }
      return executeData;
    } catch (error) {
      return {
        status: "error",
        message: `Failed to swap tokens: ${error.message}`,
      };
    }
  },
};

export default tradeTokens;
