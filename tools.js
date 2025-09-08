import balances from "./tools/balances.js";
import createAndBuy from "./tools/createAndBuy.js";
import buy from "./tools/buy.js";
import sell from "./tools/sell.js";
import twitter from "./tools/twitter.js";
import searchToken from "./tools/searchToken.js";
import memory from "./tools/memory.js";
import tradeTokens from "./tools/trade.js";
import { tool } from "@langchain/core/tools";
// import {
//   SolanaAgentKit,
//   createLangchainTools,
//   KeypairWallet,
// } from "solana-agent-kit";
// import TokenPlugin from "@solana-agent-kit/plugin-token";

const TOOLS = [
  //balances,
  createAndBuy,
  buy,
  sell,
  memory,
  // twitter,
  searchToken,
  tradeTokens,
];

const generateTools = (keypair) => {
  // const wallet = new KeypairWallet(keypair, process.env.RPC_URL);

  // const solanaKit = new SolanaAgentKit(wallet, process.env.RPC_URL, {}).use(
  //   TokenPlugin
  // );
  // const transferTool = createLangchainTools(
  //   solanaKit,
  //   solanaKit.actions.filter((action) => action.name === "TRANSFER")
  // );

  const customTools = TOOLS.map((t) =>
    tool(
      async (inputs) => {
        const output = JSON.stringify(await t.handler(keypair, inputs));
        console.log(output);
        return output;
      },
      {
        name: t.name,
        description: `
      ${t.description}

      Similes: ${t.similes.map(
        (simile) => `
        ${simile}
      `
      )}

      Examples: ${t.examples.map(
        (example) => `
        Input: ${JSON.stringify(example[0].input)}
        Output: ${JSON.stringify(example[0].output)}
        Explanation: ${example[0].explanation}
      `
      )}`,
        schema: t.schema,
      }
    )
  );
  return customTools;
};

export default generateTools;
