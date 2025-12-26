require("dotenv").config();
const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const commands = [
  new SlashCommandBuilder().setName("ping").setDescription("Kiểm tra bot").toJSON(),

  new SlashCommandBuilder()
    .setName("party")
    .setDescription("Lập kèo QUẨY cho anh em")
    .addStringOption((opt) =>
      opt.setName("title").setDescription("Tên kèo (vd: Valorant 9h)").setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("time").setDescription("Thời gian (vd: 21:00 / tối nay)").setRequired(false)
    )
    .addStringOption((opt) =>
      opt.setName("note").setDescription("Ghi chú").setRequired(false)
    )
    .toJSON(),

  new SlashCommandBuilder()
    .setName("ask")
    .setDescription("Hỏi AI (free)")
    .addStringOption((opt) =>
      opt.setName("cauhoi").setDescription("Câu hỏi của bạn").setRequired(true)
    )
    .toJSON(),
];

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log("🧪 deploy-commands.js is running");
    console.log("⏳ Deploying slash commands...");

    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );

    console.log("✅ Deployed slash commands.");
  } catch (err) {
    console.error("❌ Deploy failed:", err);
  }
})();
