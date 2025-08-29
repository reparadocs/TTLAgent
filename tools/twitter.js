import { z } from "zod";
import { TwitterApi, TwitterApiV2Settings } from "twitter-api-v2";

// Works
const twitter = {
  name: "POST_TWEET",
  similes: [
    "post tweet",
    "send tweet",
    "tweet",
    "share on twitter",
    "post on x",
    "announce",
    "social media post",
  ],
  description: "Post a tweet on Twitter/X using the X API",
  examples: [
    [
      {
        input: {
          text: "🚀 Just launched a new memecoin on Pump.fun! Check it out!",
        },
        output: {
          status: "success",
          tweetId: "1346889436626259968",
          text: "🚀 Just launched a new memecoin on Pump.fun! Check it out!",
          url: "https://x.com/username/status/1346889436626259968",
        },
        explanation:
          "Successfully posted a tweet about launching a new memecoin",
      },
    ],
  ],
  schema: z.object({
    text: z
      .string()
      .max(280)
      .describe("The text content of the tweet (max 280 characters)"),
  }),
  handler: async (wallet, inputs) => {
    console.log("twitter");
    console.log(inputs.text);
    try {
      const { text } = inputs;

      // Validate tweet length
      if (text.length > 280) {
        return {
          status: "error",
          message: "Tweet text exceeds 280 character limit.",
        };
      }
      TwitterApiV2Settings.debug = true;

      // Create Twitter API client with OAuth 1.0a authentication
      const client = new TwitterApi({
        appKey: process.env.TWITTER_API_KEY,
        appSecret: process.env.TWITTER_SECRET_KEY,
        accessToken: process.env.TWITTER_ACCESS_TOKEN,
        accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
      });

      // Post the tweet
      const tweet = await client.v2.tweet(text);

      if (tweet.data && tweet.data.id) {
        return {
          status: "success",
          tweetId: tweet.data.id,
          text: text,
          url: `https://x.com/username/status/${tweet.data.id}`,
          timestamp: new Date().toISOString(),
        };
      } else {
        throw new Error("Invalid response from Twitter API");
      }
    } catch (error) {
      return {
        status: "error",
        message: `Failed to post tweet: ${error.message}`,
      };
    }
  },
};

export default twitter;
