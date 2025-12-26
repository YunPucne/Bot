// deploy-commands.js (Discord.js v14)
// Chạy: node deploy-commands.js

require("dotenv").config();
const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

// Nếu muốn deploy nhanh trong 1 server cụ thể, set GUILD_ID trong .env
// Nếu không set, sẽ deploy GLOBAL (cập nhật có thể lâu hơn).
const GUILD_ID = process.env.GUILD_ID;

if (!TOKEN || !CLIENT_ID) {
  console.error("❌ Thiếu biến môi trường DISCORD_TOKEN hoặc CLIENT_ID trong .env");
  process.exit(1);
}

const commands = [
  // /ping
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Kiểm tra độ trễ của bot"),

  // /party (embed phía index.js)
  new SlashCommandBuilder()
    .setName("party")
    .setDescription("Mở party / rủ mọi người tham gia")
    .addStringOption((opt) =>
      opt
        .setName("title")
        .setDescription("Tiêu đề party (tuỳ chọn)")
        .setRequired(false)
    )
    .addStringOption((opt) =>
      opt
        .setName("note")
        .setDescription("Ghi chú / nội dung thêm (tuỳ chọn)")
        .setRequired(false)
    ),

  // /ask (AI)
  new SlashCommandBuilder()
    .setName("ask")
    .setDescription("Hỏi AI một câu")
    .addStringOption((opt) =>
      opt
        .setName("question")
        .setDescription("Nhập câu hỏi của bạn")
        .setRequired(true)
    )
    .addBooleanOption((opt) =>
      opt
        .setName("public")
        .setDescription("Hiện câu trả lời cho mọi người? (mặc định: false)")
        .setRequired(false)
    ),
].map((cmd) => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    console.log("🚀 Deploying slash commands...");

    if (GUILD_ID) {
      // GUILD deploy (nhanh, dùng để test)
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
        body: commands,
      });
      console.log("✅ Deploy GUILD commands thành công!");
      console.log(`   -> CLIENT_ID=${CLIENT_ID}`);
      console.log(`   -> GUILD_ID=${GUILD_ID}`);
    } else {
      // GLOBAL deploy (có thể mất vài phút đến vài giờ để hiện đủ)
      await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
      console.log("✅ Deploy GLOBAL commands thành công!");
      console.log(`   -> CLIENT_ID=${CLIENT_ID}`);
    }
  } catch (err) {
    console.error("❌ Deploy thất bại:", err);
    process.exit(1);
  }
})();
