// index.js
require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  Events,
  EmbedBuilder,
} = require("discord.js");

// ====== CONFIG CHECK ======
if (!process.env.DISCORD_TOKEN) {
  console.error("❌ Thiếu DISCORD_TOKEN trong .env");
  process.exit(1);
}

// Node 18+ có sẵn fetch. Nếu Node < 18 thì phải cài node-fetch.
if (typeof fetch !== "function") {
  console.error("❌ Môi trường thiếu fetch. Hãy dùng Node 18+.");
  process.exit(1);
}

// ====== BOT CLIENT ======
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// ====== GROQ HELPER (DÁN PHÍA TRÊN HANDLER) ======
async function askGroq(question) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("Thiếu GROQ_API_KEY (Render > Environment).");

  const url = "https://api.groq.com/openai/v1/chat/completions";

  const payload = {
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: "Bạn là trợ lý, trả lời tiếng Việt ngắn gọn, dễ hiểu." },
      { role: "user", content: question },
    ],
    temperature: 0.7,
    max_tokens: 700,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const raw = await res.text();
  let data = {};
  try { data = JSON.parse(raw); } catch {}

  if (!res.ok) {
    // In log để bạn biết rõ 400 là do gì
    console.log("Groq status:", res.status);
    console.log("Groq error body:", raw);
    const msg = data?.error?.message || raw || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data?.choices?.[0]?.message?.content?.trim() || "Không có câu trả lời.";
}

// ====== READY ======
client.once(Events.ClientReady, (c) => {
  console.log(`✅ Logged in as ${c.user.tag}`);
});

// ====== HANDLER SLASH COMMANDS ======
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  try {
    // /ping
    if (interaction.commandName === "ping") {
      return await interaction.reply({ content: "🏓 Pong!", ephemeral: true });
    }

    // /party (embed)
    if (interaction.commandName === "party") {
      const title = interaction.options.getString("title") || "🎉 Party Time!";
      const note = interaction.options.getString("note") || "Ai tham gia thì vào chung vui nhé!";

      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(note)
        .setFooter({ text: "Dùng /party để tạo party mới" });

      return await interaction.reply({ embeds: [embed] });
    }

    // /ask (AI Groq)
    if (interaction.commandName === "ask") {
      const cauhoi = interaction.options.getString("cauhoi", true); // ✅ ĐỒNG BỘ VỚI DEPLOY
      const isPublic = interaction.options.getBoolean("public") ?? false;

      // ✅ ACK ngay để không “ứng dụng không phản hồi”
      await interaction.deferReply({ ephemeral: !isPublic });

      const answer = await askGroq(cauhoi);

      return await interaction.editReply(answer);
    }
  } catch (err) {
    console.error("Command error:", err);

    const msg = `❌ Lỗi: ${err?.message || "Không rõ nguyên nhân."}`;
    if (interaction.deferred || interaction.replied) {
      return interaction.editReply(msg);
    }
    return interaction.reply({ content: msg, ephemeral: true });
  }
});

// ====== LOGIN ======
client.login(process.env.DISCORD_TOKEN);
