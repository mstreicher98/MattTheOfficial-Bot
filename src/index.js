require("dotenv").config();
const fs = require("fs");
const path = require("path");
const {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
  ActivityType,
  Collection,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  PermissionsBitField,
} = require("discord.js");
const axios = require("axios");

const streamData = require("./data/stream.json");
const twitchStreamer = streamData.streamer;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});
client.commands = new Collection();

const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(__dirname, "commands");
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
      );
    }
  }
}

/**
 * Events ClientReady
 * Schreibt eine log message in der console.
 * Setzt die Activity des Bots.
 */
client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setActivity("👀 Überwacht den Discord", {
    type: ActivityType.Custom,
  });
});

/**
 * Event GuildMemberAdd
 * Schreibt eine log message in den angegeben channel.
 */
client.on(Events.GuildMemberAdd, async (member) => {
  let channel = client.channels.cache.get("1238237132103876628");
  if (channel) {
    await channel.send(`✅ ${member} ist dem Server beigetreten!`);
  }
  await member.roles.add("544623720778563604");
});

/**
 * Event GuildMemberRemove
 * Schreibt eine log message in den angegeben channel.
 */
client.on(Events.GuildMemberRemove, async (member) => {
  let channel = client.channels.cache.get("1238237132103876628");
  if (channel) {
    await channel.send(`⛔ ${member} hat dem Server verlassen!`);
  }
});

/**
 * Event InteractionCreate
 */
client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "clearall") {
      if (
        interaction.member.permissions.has([
          PermissionsBitField.Flags.ManageMessages,
        ])
      ) {
        const channel = interaction.channel;
        const messages = await channel.messages.fetch();

        for (const [, message] of messages) {
          await message.delete();
          await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 Sekunde warten
        }

        interaction.reply({
          content: `Es wurden alle Nachrichten in diesem Channel entfernt.`,
          ephemeral: true,
        });
        setTimeout(() => interaction.deleteReply(), 3000);
      } else {
        interaction.reply({
          content: `Du hast keine Berechtigung diesen Befehl zu nutzen.`,
          ephemeral: true,
        });
        setTimeout(() => interaction.deleteReply(), 3000);
      }
    }
    if (interaction.commandName === "clear") {
      if (
        interaction.member.permissions.has([
          PermissionsBitField.Flags.ManageMessages,
        ])
      ) {
        const anzahl = interaction.options.getInteger("anzahl");

        const channel = interaction.channel;
        const messages = await channel.messages.fetch({ limit: anzahl });
        
        for (const [, message] of messages) {
          await message.delete();
          await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 Sekunde warten
        }
        interaction.reply({
          content: `Es wurden **${anzahl}** Nachrichten in diesem Channel entfernt.`,
          ephemeral: true,
        });
        setTimeout(() => interaction.deleteReply(), 3000);
      } else {
        interaction.reply({
          content: `Du hast keine Berechtigung diesen Befehl zu nutzen.`,
          ephemeral: true,
        });
        setTimeout(() => interaction.deleteReply(), 3000);
      }
    }
  }
});

/**
 * Meldet den Bot an und der Bot geht online.
 */
client.login(process.env.DISCORD_TOKEN);

/**
 * Funktion getTwitchToken
 * Sendet einen Rest API request an Twitch für den Access Token.
 */
const getTwitchToken = () => {
  axios
    .post(
      `https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
    )
    .then((res) => {
      twitchToken = res.data.access_token;
      console.log(
        `Twitch Access Token wurde gesetzt: ${res.data.access_token}`,
      );
    })
    .catch((err) => {
      console.log(`Twitch Access Token konnte nicht gesetzt werden!`);
    });
};

/**
 * Setzt den Token alle 24h neu.
 */
getTwitchToken();
setInterval(
  () => {
    getTwitchToken();
  },
  1000 * 60 * 60 * 24,
);

/**
 * Funktion sendLiveNotification
 * Sendet eine Benachrichtigung an den Discord Channel, wenn der Streamer live geht.
 */
const sendLiveNotification = (stream) => {
  let date = new Date();
  let stringDate = `${date.getDay()}${date.getMonth()}${date.getFullYear()}${date.getHours()}${date.getMinutes()}${date.getSeconds()}`;
  const channel = client.channels.cache.get("899358616547622913");

  let streamerEmbed = new EmbedBuilder()
    .setColor(0x6441a5)
    .setTitle(stream.title)
    .setURL(`https://twitch.tv/${stream.user_name}`)
    .setAuthor({
      name: `${stream.user_name} ist jetzt live auf Twitch!`,
      url: `https://twitch.tv/${stream.user_name}`,
    })
    .addFields(
      { name: "Game", value: `${stream.game_name}`, inline: true },
      { name: "Zuschauer", value: `${stream.viewer_count}`, inline: true },
      {
        name: "Kanal",
        value: `https://twitch.tv/${stream.user_name}`,
      },
    )
    .setImage(
      `${stream.thumbnail_url
        .replace("{width}", "1920")
        .replace("{height}", "1080")}?date=${stringDate.toString()}`,
    )
    .setTimestamp()
    .setFooter({
      text: "MattTheOfficial Bot",
      iconURL: client.user.avatarURL(),
    });

  let watch = new ButtonBuilder()
    .setLabel("Stream ansehen")
    .setURL(`https://twitch.tv/${stream.user_name}`)
    .setStyle(ButtonStyle.Link);

  let row = new ActionRowBuilder().addComponents(watch);

  if (channel) {
    channel.send({
      content: "@everyone",
      embeds: [streamerEmbed],
      components: [row],
    });
  }
};

/**
 * Checkt jede Minute ob der Streamer live ist.
 */
setInterval(() => {
  axios
    .get(
      `https://api.twitch.tv/helix/streams?user_login=${twitchStreamer.name.toLowerCase()}`,
      {
        headers: {
          "Client-ID": process.env.TWITCH_CLIENT_ID,
          Authorization: `Bearer ${twitchToken}`,
        },
      },
    )
    .then((res) => {
      if (res.data.data.length > 0) {
        let stream = res.data.data[0];
        if (!twitchStreamer.isLive) {
          twitchStreamer.isLive = true;
          fs.writeFileSync(
            "./src/data/stream.json",
            JSON.stringify(streamData, null, 2),
          );
          sendLiveNotification(stream);
        }
      } else {
        twitchStreamer.isLive = false;
        fs.writeFileSync(
          "./src/data/stream.json",
          JSON.stringify(streamData, null, 2),
        );
      }
    });
}, 60000);
