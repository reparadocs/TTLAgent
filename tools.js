import balances from "./tools/balances.js";
import createAndBuy from "./tools/createAndBuy.js";
import buy from "./tools/buy.js";
import sell from "./tools/sell.js";
import twitter from "./tools/twitter.js";
import postBounty from "./tools/postBounty.js";
import searchToken from "./tools/searchToken.js";
import tradeTokens from "./tools/trade.js";
import { tool } from "@langchain/core/tools";

const TOOLS = [
  balances,
  createAndBuy,
  buy,
  sell,
  twitter,
  searchToken,
  postBounty,
  tradeTokens,
];

const generateTools = (wallet) => {
  return TOOLS.map((t) =>
    tool(
      async (inputs) => {
        const output = JSON.stringify(await t.handler(wallet, inputs));
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
};

export default generateTools;
