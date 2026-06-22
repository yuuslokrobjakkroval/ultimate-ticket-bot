const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { showMainDashboard } = require('../components/setup/mainDashboard');
const GuildConfig = require('../models/GuildConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-setup')
    .setDescription('Open the ticket system configuration dashboard')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    let config = await GuildConfig.findOne({ guildId: interaction.guildId });
    if (!config) {
      config = await GuildConfig.create({ guildId: interaction.guildId });
    }

    await showMainDashboard(interaction, config);
  },
};
