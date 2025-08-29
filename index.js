import dotenv from "dotenv";
dotenv.config();

import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { Keypair, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import {
  SolanaAgentKit,
  createLangchainTools,
  KeypairWallet,
} from "solana-agent-kit"; // or import createLangchainTools if using langchain or createOpenAITools for OpenAI agents
import TokenPlugin from "@solana-agent-kit/plugin-token";
import fs from "fs";
import path from "path";
import {
  SCOUT_ACTIONS,
  EXECUTOR_ACTIONS,
  STRATEGIST_ACTIONS,
} from "./constants.js";
import generateTools from "./tools.js";

// Initialize Solana connection and agent
const keypair = Keypair.fromSecretKey(
  bs58.decode(process.env.SOLANA_PRIVATE_KEY)
);

const wallet = new KeypairWallet(keypair, process.env.RPC_URL);

const solanaKit = new SolanaAgentKit(wallet, process.env.RPC_URL, {}).use(
  TokenPlugin
);

const customTools = generateTools(wallet);
const transferTool = createLangchainTools(
  solanaKit,
  solanaKit.actions.filter((action) => action.name === "TRANSFER")
);

const allTools = [...transferTool, ...customTools];

const scoutTools = allTools.filter((action) =>
  SCOUT_ACTIONS.includes(action.name)
);

const executorTools = allTools.filter((action) =>
  EXECUTOR_ACTIONS.includes(action.name)
);

const strategistTools = allTools.filter((action) =>
  STRATEGIST_ACTIONS.includes(action.name)
);

const strategistModel = new ChatOpenAI({
  modelName: "gpt-5",
  openAIApiKey: process.env.OPENAI_API_KEY,
});

const scoutModel = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  openAIApiKey: process.env.OPENAI_API_KEY,
});

const executorModel = new ChatOpenAI({
  modelName: "o3",
  openAIApiKey: process.env.OPENAI_API_KEY,
});

// Read system prompt from file
const executorPhaseOneMessage = fs.readFileSync(
  path.join(process.cwd(), "phase_one.txt"),
  "utf8"
);

const strategistPhaseTwoMessage = fs.readFileSync(
  path.join(process.cwd(), "phase_two.txt"),
  "utf8"
);

// Create React agent
const strategist = createReactAgent({
  llm: strategistModel,
  tools: strategistTools,
  prompt: executorPhaseOneMessage,
});

const strategistTwo = createReactAgent({
  llm: strategistModel,
  tools: strategistTools,
  prompt: strategistPhaseTwoMessage,
});

const scout = createReactAgent({
  llm: scoutModel,
  tools: scoutTools,
  prompt:
    "You are a helpful scout that can use read-only tools to assist a separate strategist model with data it needs to eventually make transactions on the solana blockchain.",
});

const executor = createReactAgent({
  llm: executorModel,
  tools: executorTools,
  prompt: "",
});

const memory = [];

// Main execution function
async function runAgent() {
  try {
    console.log("🚀 Solana AI Agent started!");
    console.log("Current wallet address:", keypair.publicKey.toString());

    // Example usage - you can modify this or make it interactive
    const result = await strategist.invoke({
      messages: [
        {
          role: "user",
          content: `What do you want scout to do?`,
        },
      ],
    });

    const phaseOneResponse =
      result.messages[result.messages.length - 1].content;
    console.log(phaseOneResponse);

    const scoutResult = await scout.invoke({
      messages: [{ role: "user", content: phaseOneResponse }],
    });

    const scoutResponse =
      scoutResult.messages[scoutResult.messages.length - 1].content;

    console.log(scoutResponse);

    const phaseTwo = await strategistTwo.invoke({
      messages: [
        {
          role: "user",
          content:
            "The scout has returned the following info: " + scoutResponse,
        },
      ],
    });

    const phaseTwoResponse =
      phaseTwo.messages[phaseTwo.messages.length - 1].content;

    console.log(phaseTwoResponse);

    return phaseTwoResponse;
  } catch (error) {
    console.error("Error running agent:", error);
  }
}

// Run the agent every 30 seconds

while (true) {
  console.log("Starting Solana AI Agent with 30-second intervals...");
  const result = await runAgent(); // Run immediately first time
  memory.push(result);
  await new Promise((resolve) => setTimeout(resolve, 30000));
}
