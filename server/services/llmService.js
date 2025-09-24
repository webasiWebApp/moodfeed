const { GoogleGenerativeAI } = require('@google/generative-ai');

class LlmService {
  constructor() {
    console.log("LLM WOrks")
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in the environment variables.');
    }
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Define the schema for the JSON output
    const responseSchema = {
      type: 'array',
      items: {
        type: 'string',
      },
    };

    // Configure the model to use JSON output
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema,
      },
    });
  }

  async generateRecommendations(likedPosts, dislikedPosts, candidatePosts) {
    // The prompt is simplified as the model now knows to output JSON.
    const prompt = `
You are a social media recommendation engine. Your task is to analyze user preferences and select the 6 most relevant posts from a given list.

**User Data:**

- **Liked Posts:** The user has liked the following posts. This data indicates their interests, preferred topics, authors, and moods.
  - ${JSON.stringify(likedPosts, null, 2)}

- **Disliked Posts:** The user has indicated they do not want to see these posts. This data helps identify what topics, authors, or moods to avoid.
  - ${JSON.stringify(dislikedPosts, null, 2)}

**Posts for Selection:**

- **Candidate Posts:** From this list, you must select the 6 posts that are most likely to be relevant and engaging for the user.
  - ${JSON.stringify(candidatePosts, null, 2)}

**Instructions:**

1.  **Analyze:** Based on the user's "Liked Posts" and "Disliked Posts," identify a pattern of preferences. Look for common themes in \`content\`, frequent \`author_id\`s, and recurring \`mood\`s in the liked list, and avoid those from the disliked list.
2.  **Select:** From the "Candidate Posts" list, choose the 6 posts that best match the user's inferred preferences.
3.  **Output:** Provide a list of the 6 selected \`post_id\`s.
`;

    let text;
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;

      text = response.text();
      // The response is a JSON string, so we can parse it directly.
      return JSON.parse(text);
    } catch (error) {
      // Special handling for rate-limiting errors (429)
      if (error.status === 429) {
        console.warn('LLM rate limit exceeded. Falling back to default behavior (no recommendations).', error.message);
        return []; // Return empty array to allow fallback to recent posts
      }
      
      console.error('Error generating or parsing recommendations from LLM:', error);
      if (text) {
        console.error('LLM response text that failed parsing:', text);
      }
      throw new Error('Failed to get recommendations from the LLM service.');
    }
  }
}

module.exports = new LlmService();