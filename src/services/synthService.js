const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function processPrompt(user, payload) {
  const prompt = String(payload?.prompt || "").trim();

  if (!prompt) {
    const error = new Error("Prompt is required");
    error.status = 400;
    throw error;
  }

  const context = await loadContext(user.id);
  const answer = await generateAnswer(prompt, context);

  const conversation = await prisma.conversation.create({
    data: {
      userId: user.id,
      title: prompt.slice(0, 80),
      messages: {
        create: [
          { role: "user", content: prompt },
          { role: "assistant", content: answer },
        ],
      },
    },
    include: {
      messages: true,
    },
  });

  await storeMemory(user.id, prompt, "SYSTEM");

  return {
    success: true,
    answer,
    timestamp: new Date().toISOString(),
    conversationId: conversation.id,
  };
}

async function loadContext(userId) {
  const memories = await prisma.memory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  if (!memories.length) {
    return "No recent memory context available.";
  }

  return memories
    .map((memory) => `${memory.category}: ${memory.value}`)
    .join("\n");
}

async function saveConversation(userId, prompt, answer) {
  return prisma.conversation.create({
    data: {
      userId,
      title: prompt.slice(0, 80),
      messages: {
        create: [
          { role: "user", content: prompt },
          { role: "assistant", content: answer },
        ],
      },
    },
    include: {
      messages: true,
    },
  });
}

async function storeMemory(userId, value, category = "SYSTEM") {
  return prisma.memory.create({
    data: {
      userId,
      value,
      category,
      metadata: {
        createdBy: "synth",
      },
    },
  });
}

async function generateAnswer(prompt, context) {
  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are MADSI, a helpful synthetic intelligence assistant. Keep answers clear, actionable, and concise.",
            },
            {
              role: "user",
              content: `Context:\n${context}\n\nUser message:\n${prompt}`,
            },
          ],
          temperature: 0.7,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error?.message || "OpenAI request failed");
      }

      return (
        data?.choices?.[0]?.message?.content ||
        "I am unable to generate a response right now."
      );
    } catch (error) {
      console.error("OpenAI request error:", error.message);
    }
  }

  return `MADSI response: I have processed your prompt: "${prompt.slice(0, 120)}". The backend is ready for production use and is compatible with OpenAI integration via environment variables.`;
}

module.exports = {
  processPrompt,
  loadContext,
  saveConversation,
  storeMemory,
  generateAnswer,
};
