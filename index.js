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

if (typeof fetch !== "function") {
  console.error("❌ Môi trường thiếu fetch. Hãy dùng Node 18+.");
  process.exit(1);
}

// ====== BOT CLIENT ======
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// ====== GROQ HELPER ======
async function askGroq(question) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("Thiếu GROQ_API_KEY");

  const res = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: "Trả lời tiếng Việt, ngắn gọn, dễ hiểu." },
          { role: "user", content: question },
        ],
        temperature: 0.7,
        max_tokens: 700,
      }),
    }
  );

  const raw = await res.text();
  let data = {};
  try { data = JSON.parse(raw); } catch {}

  if (!res.ok) {
    console.log("Groq error:", raw);
    throw new Error(data?.error?.message || "Groq API lỗi");
  }

  return data.choices?.[0]?.message?.content?.trim() || "Không có câu trả lời.";
}

// ====== READY ======
client.once(Events.ClientReady, (c) => {
  console.log(`✅ Logged in as ${c.user.tag}`);
});

// ====== HANDLER ======
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  try {
    // /ping
    if (interaction.commandName === "ping") {
      return await interaction.reply({ content: "🏓 Pong!", ephemeral: true });
    }

    // /party (embed)
    if (interaction.commandName === "party") {
      const title =
        interaction.options.getString("title") || "🎉 Party Time!";
      const note =
        interaction.options.getString("note") ||
        "Ai tham gia thì vào chung vui nhé!";

      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(note)
        .setFooter({ text: "Dùng /party để tạo party mới" });

      return await interaction.reply({ embeds: [embed] });
    }

    // /ask — MẶC ĐỊNH PUBLIC + HIỆN CẢ HỎI & ĐÁP
    if (interaction.commandName === "ask") {
      const cauhoi = interaction.options.getString("cauhoi", true);

      // ✅ MẶC ĐỊNH PUBLIC
      await interaction.deferReply({ ephemeral: false });

      const answer = await askGroq(cauhoi);

      const embed = new EmbedBuilder()
        .setTitle("🤖 AI Trả Lời")
        .addFields(
          { name: "❓ Câu hỏi", value: cauhoi.slice(0, 1024) },
          { name: "✅ Trả lời", value: answer.slice(0, 1024) }
        )
        .setFooter({ text: `Hỏi bởi: ${interaction.user.tag}` });

      return await interaction.editReply({ embeds: [embed] });
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
