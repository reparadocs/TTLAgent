import { z } from "zod";

const postBounty = {
  name: "POST_BOUNTY",
  similes: [
    "create bounty",
    "offer reward",
    "request tool",
    "hire developer",
    "crowdsource development",
    "offer SOL for tool",
  ],
  description:
    "Post a development bounty offering SOL to anyone who builds a specific tool or feature.",
  examples: [
    [
      {
        input: {
          toolDescription:
            "A tool that allows me to access Discord channels and send messages to them",
          bountyAmount: "0.5",
          requirements:
            "Must include a way to get access to key crypto discord servers and channels.",
        },
        output: {
          status: "success",
        },
        explanation:
          "Successfully posted a bounty for 0.5 SOL to build an NFT analysis tool",
      },
    ],
  ],
  schema: z.object({
    toolDescription: z
      .string()
      .min(10)
      .max(1000)
      .describe("Detailed description of the tool or feature you want built"),
    bountyAmount: z
      .string()
      .describe("Amount of SOL to offer as bounty reward"),
    requirements: z
      .string()
      .describe("Specific technical requirements or constraints for the tool"),
  }),
  handler: async (wallet, inputs) => {
    try {
      const { toolDescription, bountyAmount, requirements } = inputs;

      // Validate bounty amount
      const bountySol = parseFloat(bountyAmount);
      if (isNaN(bountySol) || bountySol <= 0) {
        return {
          status: "error",
          message: "Invalid bounty amount. Please provide a positive number.",
        };
      }

      // Generate a unique bounty ID
      const bountyId = `bounty_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // For now, just console.log the bounty details
      console.log("🚀 NEW DEVELOPMENT BOUNTY POSTED! 🚀");
      console.log("=====================================");
      console.log(`Bounty ID: ${bountyId}`);
      console.log(`Tool Description: ${toolDescription}`);
      console.log(`Bounty Amount: ${bountyAmount} SOL`);
      console.log(`Requirements: ${requirements || "None specified"}`);
      console.log(`Posted by: ${wallet.publicKey.toBase58()}`);
      console.log(`Timestamp: ${new Date().toISOString()}`);
      console.log("=====================================");
      console.log(
        "💡 Developers: If you can build this tool, contact the bounty poster!"
      );
      console.log("");

      // Return success response
      return {
        status: "success",
      };
    } catch (error) {
      return {
        status: "error",
        message: `Failed to post bounty: ${error.message}`,
      };
    }
  },
};

export default postBounty;
