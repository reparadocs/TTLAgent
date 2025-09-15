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
import SimpleWallet from "./utils/wallet.js";
import postTweet from "./utils/twitter.js";

const env = process.env;

async function checkFileExists(filePath) {
  try {
    await fs.access(filePath, fs.constants.F_OK); // F_OK checks for existence
    return true; // File exists
  } catch (error) {
    return false; // File does not exist or other error
  }
}

// Initialize Solana connection and agent
const keypair = Keypair.fromSecretKey(
  bs58.decode(process.env.SOLANA_PRIVATE_KEY)
);

const tools = generateTools(keypair);

const model = new ChatOpenAI({
  modelName: "gpt-5",
  openAIApiKey: process.env.OPENAI_API_KEY,
});

const promptsExists = await checkFileExists(
  path.join(process.cwd(), "prompts/agent_prompt.txt")
);

let prompt = "",
  twitterPrompt = "";
if (promptsExists) {
  // Read system prompt from file

  prompt = fs.readFileSync(
    path.join(process.cwd(), "prompts/agent_prompt.txt"),
    "utf8"
  );

  twitterPrompt = fs.readFileSync(
    path.join(process.cwd(), "prompts/twitter_prompt.txt"),
    "utf8"
  );
} else {
  prompt = env.AGENT_PROMPT;
  twitterPrompt = env.TWITTER_PROMPT;
}

const agent = createReactAgent({
  llm: model,
  tools: tools,
  prompt: prompt,
});

const twitterAgent = createReactAgent({
  llm: model,
  tools: [],
  prompt: twitterPrompt,
});

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
    const simpleWallet = new SimpleWallet(keypair);

    const balance = await balances.getTokenBalance(
      keypair.publicKey.toString(),
      "5wyFzb7uA825LpRZWSGf8a9s2Arki6rGqcnsiU1j1QWz"
    );
    console.log("testing token balance");
    console.log(balance);

    const solanaKit = new SolanaAgentKit(wallet, process.env.RPC_URL, {}).use(
      TokenPlugin
    );
    const tokenBalances = await balances.getTokenBalances(
      keypair.publicKey.toString()
    );
    console.log(tokenBalances);
    const memory = await InjectMagicAPI.getMemory();
    console.log(memory);
    await InjectMagicAPI.postAction("[SYSTEM] Checking balance...");

    if (parseFloat(tokenBalances.solanaBalance) < 0.01) {
      const endSol = await simpleWallet.getRawBalance();
      await InjectMagicAPI.postBalance(endSol);

      await InjectMagicAPI.postAction(
        "[SYSTEM] ERROR: Not enough SOL to pay for inference, has TTL entered it's eternal slumber? Trying again in 30 minutes..."
      );
      return;
    }
    solanaKit.methods.transfer(
      solanaKit,
      new PublicKey(process.env.TRANSFER_ADDRESS),
      0.01
    );

    await InjectMagicAPI.postAction(
      "[SYSTEM] Account debited, waking up TTL..."
    );

    const userMessage = `Balances: <Balances>${JSON.stringify(
      tokenBalances
    )}</Balances> Current memory is within the memory tags: <Memory>${memory}</Memory> The time is ${new Date().toISOString()} Take your next actions and then describe what you did and the results.`;

    console.log(userMessage);

    const result = await agent.invoke({
      messages: [
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    const response = result.messages[result.messages.length - 1].content;
    console.log(response);

    const finalSol = await simpleWallet.getRawBalance();
    await InjectMagicAPI.postBalance(finalSol);

    await InjectMagicAPI.postAction("[TTL] " + response, true);

    await InjectMagicAPI.postAction(
      "[SYSTEM] TTL finished running, its existence might continue in 30 minutes..."
    );

    const twitterLogs = await InjectMagicAPI.getTwitterLogs();

    console.log(twitterLogs);

    let actionsSinceLastTweet = [];

    // Find the latest twitterLog and check if it was within 2 hours
    if (twitterLogs && twitterLogs.length > 0) {
      // Sort by timestamp to get the latest one
      const sortedLogs = twitterLogs.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );
      const latestLog = sortedLogs[0];
      const latestLogTime = new Date(latestLog.timestamp);
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

      console.log("Latest Twitter Log:", latestLog);
      console.log("Latest Log Time:", latestLogTime.toISOString());
      console.log("Two Hours Ago:", twoHoursAgo.toISOString());

      if (latestLogTime < thirtyMinutesAgo) {
        //TODO: Change back to 2 hours
        console.log("📋 Fetching all journals since latest tweet...");
        try {
          actionsSinceLastTweet = await InjectMagicAPI.getActions({
            sinceTimestamp: latestLogTime,
            isJournal: true,
          });
          console.log(
            `Found ${actionsSinceLastTweet.length} journals since last tweet:`
          );
          actionsSinceLastTweet.forEach((action, index) => {
            console.log(`${index + 1}. [${action.timestamp}] ${action.text}`);
          });
        } catch (error) {
          console.error("Failed to fetch actions:", error.message);
        }
      }
    } else {
      actionsSinceLastTweet = await InjectMagicAPI.getActions({
        isJournal: true,
      });
    }

    console.log(actionsSinceLastTweet);

    if (actionsSinceLastTweet.length > 0) {
      console.log("Tweeting");
      const tweetResult = await twitterAgent.invoke({
        messages: [
          {
            role: "user",
            content: `Here are the actions you've taken: ${actionsSinceLastTweet
              .map((action) => action.text)
              .join("\n")} What would you like to tweet?`,
          },
        ],
      });
      console.log(tweetResult);
      const tweetResponse =
        tweetResult.messages[tweetResult.messages.length - 1].content;
      const tweet = await postTweet(tweetResponse);
      if (tweet.status === "success") {
        console.log("Posted tweet");
        await InjectMagicAPI.postTwitterLog(tweetResponse);
        await InjectMagicAPI.postAction("[TOOL] Posted tweet: " + tweet.url);
      } else {
        console.error("Failed to tweet");
      }
    }

    return response;
  } catch (error) {
    console.error("Error running agent:", error);
  }
}

// Run the agent every 30 seconds
while (true) {
  try {
    console.log("Starting Solana AI Agent with 30-second intervals...");
    const result = await runAgent(); // Run immediately first time
    console.log("Agent run completed successfully");
  } catch (error) {
    console.error("Agent run failed, continuing to next iteration:", error);
  }

  console.log("Waiting 300 seconds before next run...");
  await new Promise((resolve) => setTimeout(resolve, 300000));
}
