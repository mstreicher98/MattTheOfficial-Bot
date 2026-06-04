require("dotenv").config();
const fs = require("fs");
const { REST, Routes } = require("discord.js");

const commands = [];

const commandFiles = fs.readdirSync("./src/commands").filter((file) => file.endsWith(".js"));

commandFiles.forEach((file) => {
  const command = require(`../commands/${file}`);
  commands.push(command.data.toJSON());
});

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		const data = await rest.put(
			Routes.applicationGuildCommands(process.env.DISCORD_APP_ID, process.env.DISCORD_GUILD_ID),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		console.error(error);
	}
})();
