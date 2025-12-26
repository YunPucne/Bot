require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  Events,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");

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
    .setColor(0x00ff99)
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

client.on(Events.InteractionCreate, async (interaction) => {
  // Slash commands
  if (interaction.isChatInputCommand()) {
    // /ping
    if (interaction.commandName === "ping") {
      return interaction.reply({ content: "Pong! ✅", ephemeral: true });
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

      const embed = buildPartyEmbed({
        title,
        time,
        note,
        members: [],
      });

      await interaction.reply({
        embeds: [embed],
        components: [row],
      });

      const msg = await interaction.fetchReply();
      partyMembers.set(msg.id, new Set());
      partyData.set(msg.id, { title, time, note });
    }
  }

  // Buttons
  if (interaction.isButton()) {
    if (interaction.customId !== "party_join" && interaction.customId !== "party_leave") return;

    const msgId = interaction.message.id;

    if (!partyMembers.has(msgId)) partyMembers.set(msgId, new Set());
    const set = partyMembers.get(msgId);

    if (interaction.customId === "party_join") {
      set.add(interaction.user.id);
      await interaction.reply({ content: "⚔️ Đã chiến!", ephemeral: true });
    } else {
      set.delete(interaction.user.id);
      await interaction.reply({ content: "💨 Đã té!", ephemeral: true });
    }

    const data = partyData.get(msgId) || { title: "QUẨY", time: "", note: "" };
    const embed = buildPartyEmbed({
      ...data,
      members: Array.from(set),
    });

    await interaction.message.edit({ embeds: [embed] });
  }
});

client.login(process.env.DISCORD_TOKEN);
