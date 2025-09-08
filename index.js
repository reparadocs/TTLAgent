import dotenv from "dotenv";
dotenv.config();

import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { Keypair, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import fs from "fs";
import path from "path";
import generateTools from "./tools.js";
import balances from "./utils/balances.js";
import { SolanaAgentKit, KeypairWallet } from "solana-agent-kit";
import TokenPlugin from "@solana-agent-kit/plugin-token";
import InjectMagicAPI from "./utils/api.js";

// Initialize Solana connection and agent
const keypair = Keypair.fromSecretKey(
  bs58.decode(process.env.SOLANA_PRIVATE_KEY)
);

const tools = generateTools(keypair);

const model = new ChatOpenAI({
  modelName: "gpt-5",
  openAIApiKey: process.env.OPENAI_API_KEY,
});

// Read system prompt from file
const prompt = fs.readFileSync(path.join(process.cwd(), "prompt.txt"), "utf8");

const agent = createReactAgent({
  llm: model,
  tools: tools,
  prompt: prompt,
});

const memory = [];

async function testExecutor() {
  const tokenBalances = await balances.getTokenBalances(
    keypair.publicKey.toString()
  );
  console.log(tokenBalances);

  const result = await agent.invoke({
    messages: [
      {
        role: "user",
        content: `Use the twitter tool to tweet anything you want.`,
      },
    ],
  });
  const response = result.messages[result.messages.length - 1].content;
  console.log(response);
}

// Main execution function
async function runAgent() {
  try {
    console.log("🚀 Solana AI Agent started!");
    console.log("Current wallet address:", keypair.publicKey.toString());

    const wallet = new KeypairWallet(keypair, process.env.RPC_URL);

    const solanaKit = new SolanaAgentKit(wallet, process.env.RPC_URL, {}).use(
      TokenPlugin
    );
    const tokenBalances = await balances.getTokenBalances(
      keypair.publicKey.toString()
    );
    console.log(tokenBalances);
    const memory = await InjectMagicAPI.getMemory();
    console.log(memory);
    await InjectMagicAPI.postAction("Waking up... 🫩");

    if (parseFloat(tokenBalances.solanaBalance) < 0.01) {
      await InjectMagicAPI.postAction(
        "Not enough SOL to continue, shutting down... it's been a good run, goodbye and i love you 😢 🪦"
      );
    }
    solanaKit.methods.transfer(
      solanaKit,
      new PublicKey(process.env.TRANSFER_ADDRESS),
      0.01
    );

    const prompt = `Balances: <Balances>${JSON.stringify(
      tokenBalances
    )}</Balances> Current memory is within the memory tags: <Memory>${memory}</Memory>  Take your next actions and then describe what you did and the results.`;

    console.log(prompt);

    const result = await agent.invoke({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const response = result.messages[result.messages.length - 1].content;
    console.log(response);

    await InjectMagicAPI.postAction(response);

    await InjectMagicAPI.postAction("Taking a 30 minute nap! 😴");

    return response;
  } catch (error) {
    console.error("Error running agent:", error);
  }
}

// Run the agent every 30 seconds

while (true) {
  console.log("Starting Solana AI Agent with 30-second intervals...");
  const result = await runAgent(); // Run immediately first time
  await new Promise((resolve) => setTimeout(resolve, 30000));
}
