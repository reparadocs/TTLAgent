import { z } from "zod";
// Works but may want to actually get the name of the token
const balances = {
  name: "CHECK_BALANCES",
  similes: [
    "get token balances",
    "get wallet balances",
    "check token holdings",
  ],
  description:
    "Get all token balances including SOL balance and SPL token balances.",
  examples: [
    [
      {
        input: {},
        output: [
          {
            tokenMint: "So11111111111111111111111111111111111111112",
            amount: "1.234567",
          },
          {
            tokenMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            amount: "100.0",
          },
        ],
        explanation: "Got SOL balance and USDC balance",
      },
    ],
  ],
  schema: z.object({}),
  handler: async (wallet, inputs) => {
    try {
      const address = wallet.publicKey.toBase58();
      console.log(address);
      console.log("balances");

      // Call Jupiter API to get balances for the address
      const response = await fetch(
        `https://api.jup.ag/ultra/v1/balances/${address}`,
        {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.JUPITER_API_KEY || "",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Jupiter API error: ${response.status}`);
      }

      const data = await response.json();
      console.log(data);

      // Flatten the object response into an array
      const results = Object.entries(data).map(([mint, tokenData]) => ({
        tokenMint: mint,
        amount: tokenData.uiAmount.toString(),
      }));

      console.log(results);

      return results;
    } catch (error) {
      return {
        status: "error",
        message: `Failed to get token balances: ${error.message}`,
      };
    }
  },
};

export default balances;
