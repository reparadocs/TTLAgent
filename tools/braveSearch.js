import { z } from "zod";

const braveSearch = {
  name: "BRAVE_SEARCH",
  similes: [
    "search web",
    "web search",
    "search internet",
    "find information",
    "look up",
    "research",
    "brave search",
  ],
  description:
    "Search the web using Brave Search API to get real-time information, news, and search results from the internet.",
  examples: [
    [
      {
        input: {
          query: "Solana blockchain news",
          count: 5,
        },
        output: {
          status: "success",
          query: "Solana blockchain news",
          results: [
            {
              title: "Latest Solana Blockchain Updates",
              url: "https://example.com/solana-news",
              description: "Recent developments in the Solana ecosystem...",
            },
            {
              title: "Solana Price Analysis",
              url: "https://example.com/solana-price",
              description: "Current market analysis for SOL...",
            },
          ],
          totalResults: 2,
        },
        explanation:
          "Successfully searched for Solana blockchain news and returned relevant results",
      },
    ],
  ],
  schema: z.object({
    query: z.string().describe("The search query to look up on the web"),
  }),
  handler: async (wallet, inputs) => {
    try {
      const { query } = inputs;

      // Build the search URL with parameters
      const searchUrl = new URL(
        "https://api.search.brave.com/res/v1/web/search"
      );
      searchUrl.searchParams.append("q", query);
      searchUrl.searchParams.append("count", count.toString());

      // Make the request to Brave Search API
      const response = await fetch(searchUrl.toString(), {
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip",
          "X-Subscription-Token": process.env.BRAVE_API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(
          `Brave Search API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      // Extract and format the search results
      const results = data.web?.results?.slice(0, count) || [];
      const formattedResults = results.map((result) => ({
        title: result.title || "",
        url: result.url || "",
        description: result.description || "",
        published: result.published || "",
      }));

      return {
        status: "success",
        query: query,
        results: formattedResults,
        totalResults: data.web?.total || 0,
        searchTime: data.web?.searchTime || 0,
      };
    } catch (error) {
      return {
        status: "error",
        message: `Failed to perform Brave search: ${error.message}`,
      };
    }
  },
};

export default braveSearch;
