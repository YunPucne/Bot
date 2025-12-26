require("dotenv").config();

/* ================== RENDER WEB SERVICE PORT ================== */
const http = require("http");
const PORT = process.env.PORT || 3000;

http
  .createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Bot is running");
  })
  .listen(PORT, () => console.log(`🌐 Web service listening on port ${PORT}`));
/* ============================================================= */

const {
  Client,
  GatewayIntentBits,
  Events,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
} = require("discord.js");

// node-fetch dynamic import (CommonJS)
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// messageId -> Set(userId)
const partyMembers = new Map();
// messageId -> { title, time, note }
const partyData = new Map();

function buildPartyEmbed({ title, time, note, members }) {
  return new EmbedBuilder()
    .setTitle("🔥 QUẨY")
    .setDescription(`**${title}**`)
    .addFields(
      { name: "⏰ Thời gian", value: time || "Không rõ", inline: true },
      { name: "📝 Ghi chú", value: note || "Không có", inline: true },
      {
        name: `👥 Tham gia (${members.length})`,
        value:
          members.length > 0
            ? members.map((id) => `<@${id}>`).join("\n")
            : "_Chưa có ai_",
      }
    )
    .setFooter({ text: "Bấm nút bên dưới để chiến / té" });
}

client.once(Events.ClientReady, (c) => {
  console.log(`✅ Logged in as ${c.user.tag}`);
});
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
          { role: "system", content: "Trả lời tiếng Việt, ngắn gọn." },
          { role: "user", content: question },
        ],
        temperature: 0.7,
        max_tokens: 600,
      }),
    }
  );

  const raw = await res.text();
  let data = {};
  try { data = JSON.parse(raw); } catch {}

  if (!res.ok) {
    console.log("Groq error:", raw);
    throw new Error("Groq API lỗi");
  }

  return data.choices[0].message.content;
}

client.on(Events.InteractionCreate, async (interaction) => {
  // Slash commands
  if (interaction.isChatInputCommand()) {
    // /ping
    if (interaction.commandName === "ping") {
      return interaction.reply({ content: "🏓 Pong!", flags: MessageFlags.Ephemeral });
    }

    // /party
    if (interaction.commandName === "party") {
      const title = interaction.options.getString("title", true);
      const time = interaction.options.getString("time") || "";
      const note = interaction.options.getString("note") || "";

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("party_join")
          .setLabel("⚔️ Chiến")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("party_leave")
          .setLabel("💨 Té")
          .setStyle(ButtonStyle.Danger)
      );

      const embed = buildPartyEmbed({ title, time, note, members: [] });

      await interaction.reply({ embeds: [embed], components: [row] });

      const msg = await interaction.fetchReply();
      partyMembers.set(msg.id, new Set());
      partyData.set(msg.id, { title, time, note });
      return;
    }

    // /ask (AI Groq - PUBLIC)
    if (interaction.commandName === "ask") {
      const question = interaction.options.getString("question", true);

      await interaction.deferReply(); // public

      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: "llama3-8b-8192",
            messages: [
              {
                role: "system",
                content:
                  "Bạn là trợ lý AI thân thiện cho nhóm bạn bè. Trả lời ngắn gọn, dễ hiểu, hạn chế dài dòng.",
              },
              { role: "user", content: question },
            ],
          }),
        });

        const text = await res.text();
        if (!res.ok) {
          console.error("Groq error:", res.status, text);
          await interaction.editReply(`❌ Groq lỗi ${res.status}. Kiểm tra GROQ_API_KEY / giới hạn.`);
          return;
        }

        const data = JSON.parse(text);
        const answer = data?.choices?.[0]?.message?.content || "❌ AI không trả lời được.";
        await interaction.editReply(answer);
      } catch (err) {
        console.error(err);
        await interaction.editReply("❌ Lỗi khi gọi AI.");
      }
      return;
    }
  }

  // Buttons for /party
  if (interaction.isButton()) {
    if (interaction.customId !== "party_join" && interaction.customId !== "party_leave") return;

    const msgId = interaction.message.id;
    if (!partyMembers.has(msgId)) partyMembers.set(msgId, new Set());
    const set = partyMembers.get(msgId);

    if (interaction.customId === "party_join") {
      set.add(interaction.user.id);
      await interaction.reply({ content: "⚔️ Đã chiến!", flags: MessageFlags.Ephemeral });
    } else {
      set.delete(interaction.user.id);
      await interaction.reply({ content: "💨 Đã té!", flags: MessageFlags.Ephemeral });
    }

    const data = partyData.get(msgId) || { title: "QUẨY", time: "", note: "" };
    const embed = buildPartyEmbed({ ...data, members: Array.from(set) });
    await interaction.message.edit({ embeds: [embed] });
  }
});

client.login(process.env.DISCORD_TOKEN);


