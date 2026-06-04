const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Lösche eine Anzahl an Nachrichten in einem Channel.")
    .addIntegerOption((option) =>
      option
        .setName("anzahl")
        .setDescription("Anzahl der Nachrichten die du entfernen möchstest.")
        .setRequired(true)),
  async execute(interaction) {

  },
};
