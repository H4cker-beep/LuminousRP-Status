require("dotenv").config();

const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const { GameDig } = require("gamedig");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const SERVER_IP = "66.248.194.23";
const SERVER_PORT = 27015;

let statusMessage = null;

async function getServerStatus() {
  try {
    const state = await GameDig.query({
      type: "garrysmod",
      host: SERVER_IP,
      port: SERVER_PORT,
      socketTimeout: 5000
    });

    return {
      online: true,
      name: state.name || "LuminousRP.net",
      map: state.map || "Unknown",
      players: state.players?.length ?? 0,
      maxPlayers: state.maxplayers ?? 0
    };
  } catch (error) {
    console.log("Server query failed:", error.message);
    return { online: false };
  }
}

async function updateStatus() {
  try {
    const channel = await client.channels.fetch(process.env.CHANNEL_ID);
    const status = await getServerStatus();

    let embed;

    if (status.online) {
      embed = new EmbedBuilder()
        .setTitle("🟢 LuminousRP.net")
        .setDescription("**Semi-Serious CityRP**")
        .addFields(
          {
            name: "👥 Players",
            value: `${status.players}/${status.maxPlayers}`,
            inline: true
          },
          {
            name: "🗺️ Map",
            value: status.map,
            inline: true
          },
          {
            name: "🎮 Game",
            value: "Garry's Mod",
            inline: true
          },
          {
            name: "🌐 IP",
            value: `${SERVER_IP}:${SERVER_PORT}`,
            inline: false
          }
        )
        .setFooter({
          text: `Last update: ${new Date().toLocaleString()}`
        })
        .setTimestamp();
    } else {
      embed = new EmbedBuilder()
        .setTitle("🔴 LuminousRP.net")
        .setDescription("**Server Offline**")
        .addFields({
          name: "🌐 IP",
          value: `${SERVER_IP}:${SERVER_PORT}`
        })
        .setFooter({
          text: `Last update: ${new Date().toLocaleString()}`
        })
        .setTimestamp();
    }

    if (process.env.MESSAGE_ID) {
      try {
        statusMessage = await channel.messages.fetch(
          process.env.MESSAGE_ID
        );
      } catch {
        statusMessage = null;
      }
    }

    if (!statusMessage) {
      statusMessage = await channel.send({
        embeds: [embed]
      });

      console.log("MESSAGE_ID =", statusMessage.id);
      console.log("Add this ID to Render as MESSAGE_ID.");
    } else {
      await statusMessage.edit({
        embeds: [embed]
      });
    }

  } catch (error) {
    console.error("Update error:", error);
  }
}

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  await updateStatus();

  // Update every 30 seconds
  setInterval(updateStatus, 30 * 1000);
});

client.login(process.env.DISCORD_TOKEN);
