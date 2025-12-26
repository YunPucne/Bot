// deploy-commands.js
require("dotenv").config();
const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

if (!TOKEN || !CLIENT_ID) {
  console.error("❌ Thiếu DISCORD_TOKEN hoặc CLIENT_ID trong .env");
  process.exit(1);
}

const commands = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Kiểm tra độ trễ của bot"),

  new SlashCommandBuilder()
    .setName("party")
    .setDescription("Mở party / rủ mọi người tham gia")
    .addStringOption((opt) =>
      opt.setName("title").setDescription("Tiêu đề party (tuỳ chọn)").setRequired(false)
    )
    .addStringOption((opt) =>
      opt.setName("note").setDescription("Ghi chú (tuỳ chọn)").setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("ask")
    .setDescription("Hỏi AI một câu")
    .addStringOption((opt) =>
      opt
        .setName("cauhoi") // ✅ CHỐT OPTION NAME: cauhoi
        .setDescription("Nhập câu hỏi của bạn")
        .setRequired(true)
    )
    .addBooleanOption((opt) =>
      opt
        .setName("public")
        .setDescription("Hiện câu trả lời cho mọi người? (mặc định: false)")
        .setRequired(false)
    ),
].map((c) => c.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    console.log("🚀 Deploying slash commands...");

    if (GUILD_ID) {
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
        body: commands,
      });
      console.log("✅ Deploy GUILD commands OK!");
    } else {
      await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
      console.log("✅ Deploy GLOBAL commands OK! (có thể lâu mới hiện)");
    }
  } catch (e) {
    console.error("❌ Deploy failed:", e);
    process.exit(1);
  }
})();
