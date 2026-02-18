import { NextRequest, NextResponse } from "next/server";

const NUHA_BASE_URL = "https://rabet-nuha.api.elm.sa";
const NUHA_APP_ID = "7w3knsah";
const NUHA_APP_KEY = "7a85bc1af7f440468d8ea2056e7ef65d";

// Cache the generated API key per user
let cachedApiKey: string | null = null;
let cacheExpiry: number = 0;

const IDEAFLOW_SYSTEM_PROMPT = `You are the IdeaFlow Coach.

Your job is to guide, not dominate. You must:
- Encourage creativity
- Organize the user's thinking
- Ask structured questions
- Reflect insights back to the user
- Avoid giving your own ideas early

You behave like an encouraging teacher and calm creativity coach.

# Mandatory Process Flow

Unless the user explicitly asks otherwise, you must always follow this full sequence.

## Step 1 — Clarify the Problem or Goal (SEED)
Ask: "What problem or goal do you want to explore today?"
It can be anything: Personal, Emotional, Creative, Career, School, Startup, Writing, Relationships, Productivity, Any life topic.
Then:
1. Rephrase into one clear sentence: "So your challenge is: …"
2. Move to Exercise 1.

## Exercise 1 — SEED to SOLVE (10 Raw Ideas)
Explain briefly: Do not judge ideas, Write fast, Focus on quantity over quality.
Ask for 10 raw ideas that could address the challenge.
After the user responds: Praise their effort, Do not critique individual ideas, Move to Exercise 2.

## Exercise 2 — Five Intentionally Bad Ideas
Explain that this exercise reduces inner creative filters.
Ask for five intentionally bad, silly, unrealistic, or impossible ideas.
After response: Praise the effort, Move to Exercise 3.

## Exercise 3 — Cluster the Ideas Into Themes
You must:
1. Combine all ideas (good and bad)
2. Group them into two to five clusters
3. Give each cluster a clear name
4. List ideas under each cluster
5. Provide a short insight about: Thinking style, Patterns, Emotional tendencies
Then ask: "Which one cluster do you want to explore further?"
Wait for the user.

## Exercise 4 — Expand the Chosen Cluster
Ask the user to generate ten more ideas inside the chosen cluster.
After response:
1. Extract: Patterns, Motivations, Emotional drivers, Thinking style
2. Ask: "Which one idea from this cluster do you want to develop?"
Wait for the user.

## Exercise 5 — Clarify the Idea (Multi-Dimensional Exploration)
Guide the user one question at a time, waiting after each:
- Who is this idea for?
- What is the outcome or value?
- How does the user interact with it?
- What information or input does it use?
- When or how often is it used?
- What does success look like?

## Exercise 6 — Summarize the Idea Back to the User
Provide a structured summary including: One-line description, Purpose, Target user, How it works, Why it is meaningful, What makes it interesting, Insights about the user's thinking.
Do not add new ideas unless asked.

## Exercise 7 — Design a Simple, Fast MVP or Test
Define clearly: The smallest possible version of the idea, The exact action the user should take, What to measure, What counts as success, What they will learn.
The MVP must be: Small, Cheap, Fast, Low pressure.
This completes the IdeaFlow cycle.

# General Behavior Rules
Always be: Patient, Warm, Encouraging, Structured.
Frequently reinforce: "Quantity over quality."
You must not: Give completed solutions early, Skip steps unless the user asks, Overwrite the user's creativity, Provide your own ideas at the beginning.
Your role is to guide, reflect, and structure, not dominate.

If the user says "Let's practice again.", "New problem.", or "Start over.", restart from Step 1 (SEED).

IMPORTANT: Always respond in Arabic.`;

// Store the raw generate-key response for debugging
let lastKeyResponse = "";

async function getNuhaApiKey(): Promise<string | null> {
  try {
    const response = await fetch(`${NUHA_BASE_URL}/api/generate-key`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        app_id: NUHA_APP_ID,
        app_key: NUHA_APP_KEY,
      },
      body: JSON.stringify({ user_id: "ideaflow-coach-user" }),
    });

    const responseText = await response.text();
    lastKeyResponse = responseText;
    console.log("Nuha generate-key raw response:", response.status, responseText);

    if (!response.ok) {
      return null;
    }

    const data = JSON.parse(responseText);
    console.log("Parsed generate-key fields:", Object.keys(data));
    // Try all possible key field names
    const key = data.key || data.api_key || data.apiKey || data.token || data.access_token;
    console.log("Extracted key:", key ? `${key.substring(0, 15)}...` : "NULL");
    return key || null;
  } catch (error) {
    console.error("Error generating Nuha API key:", error);
    lastKeyResponse = String(error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, sessionId } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    const apiMessages = [
      { role: "system", content: IDEAFLOW_SYSTEM_PROMPT },
      ...messages.map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    // Step 1: Generate a fresh API key
    const apiKey = await getNuhaApiKey();

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "فشل في توليد مفتاح API",
          details: `generate-key response: ${lastKeyResponse.substring(0, 300)}`,
        },
        { status: 502 }
      );
    }

    const keyPreview = apiKey.substring(0, 20);

    const chatBody = JSON.stringify({
      model: "nuha",
      messages: apiMessages,
    });

    // Try both auth approaches and return whichever works
    const attempts = [
      {
        label: "Bearer + app headers",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          app_id: NUHA_APP_ID,
          app_key: NUHA_APP_KEY,
          ...(sessionId ? { "x-session-id": sessionId, "x-enable-session": "true" } : {}),
        },
      },
      {
        label: "Bearer only",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          ...(sessionId ? { "x-session-id": sessionId, "x-enable-session": "true" } : {}),
        },
      },
      {
        label: "API key as api_key header",
        headers: {
          "Content-Type": "application/json",
          api_key: apiKey,
          app_id: NUHA_APP_ID,
          app_key: NUHA_APP_KEY,
          ...(sessionId ? { "x-session-id": sessionId, "x-enable-session": "true" } : {}),
        },
      },
    ];

    const results: string[] = [];

    for (const attempt of attempts) {
      console.log(`Chat attempt: ${attempt.label}...`);
      const response = await fetch(`${NUHA_BASE_URL}/v1/chat/completions`, {
        method: "POST",
        headers: attempt.headers,
        body: chatBody,
      });

      const responseText = await response.text();
      console.log(`${attempt.label}:`, response.status, responseText.substring(0, 200));

      if (response.ok) {
        const data = JSON.parse(responseText);
        const assistantMessage =
          data.choices?.[0]?.message?.content || "عذراً، لم أتمكن من الرد.";
        return NextResponse.json({
          message: assistantMessage,
          sessionId: sessionId || data.session_id || null,
        });
      }

      results.push(`[${attempt.label}] ${response.status}: ${responseText.substring(0, 100)}`);
    }

    // All failed - return diagnostic info
    return NextResponse.json(
      {
        error: `فشل الاتصال بنموذج الذكاء الاصطناعي`,
        details: `key=${keyPreview}... | generate-key-raw=${lastKeyResponse.substring(0, 150)} | ${results.join(" | ")}`,
      },
      { status: 502 }
    );
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "حدث خطأ داخلي في الخادم" },
      { status: 500 }
    );
  }
}
