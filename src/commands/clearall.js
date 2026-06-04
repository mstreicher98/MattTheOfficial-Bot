const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clearall")
    .setDescription("Lösche alle Nachrichten in einem Channel."),
  async execute(interaction) {

  },
};
