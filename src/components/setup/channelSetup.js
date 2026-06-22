const {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ChannelSelectMenuBuilder, ChannelType,
} = require('discord.js');
const GuildConfig = require('../../models/GuildConfig');
const emojis = require('../../../emojis.json');

function channelMention(id) {
  return id ? `<#${id}>` : '*(not set)*';
}

function buildChannelEmbed(config) {
  const c = config.channels;
  return new EmbedBuilder()
    .setTitle(`${emojis.channels} Channel Setup`)
    .setDescription('Select the channels for each purpose using the menus below.')
    .setColor('#5865F2')
    .addFields(
      { name: '📋 Panel Channel', value: channelMention(c.panelChannelId), inline: true },
      { name: '📂 Ticket Category', value: channelMention(c.ticketCategoryId), inline: true },
      { name: '🗄️ Archive Category', value: channelMention(c.archiveCategoryId), inline: true },
      { name: '📜 Transcript / Logs', value: channelMention(c.logsChannelId), inline: true },
      { name: '⭐ Feedback Channel', value: channelMention(c.feedbackChannelId), inline: true },
    );
}

function buildChannelRows() {
  return [
    new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId('setup:channels:panel')
        .setPlaceholder('Select panel channel (text channel)')
        .addChannelTypes(ChannelType.GuildText),
    ),
    new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId('setup:channels:ticketcat')
        .setPlaceholder('Select ticket category')
        .addChannelTypes(ChannelType.GuildCategory),
    ),
    new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId('setup:channels:archivecat')
        .setPlaceholder('Select archive category')
        .addChannelTypes(ChannelType.GuildCategory),
    ),
    new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId('setup:channels:logs')
        .setPlaceholder('Select transcript/logs channel (text channel)')
        .addChannelTypes(ChannelType.GuildText),
    ),
    new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId('setup:channels:feedback')
        .setPlaceholder('Select feedback channel (text channel)')
        .addChannelTypes(ChannelType.GuildText),
    ),
  ];
}

async function showChannelSetup(interaction, config) {
  if (!config) config = await GuildConfig.findOne({ guildId: interaction.guildId });
  const embed = buildChannelEmbed(config);
  const rows = buildChannelRows();

  // Add back button as last row (replace last component row if at limit)
  const backRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('setup:main').setLabel('Back').setEmoji(emojis.back).setStyle(ButtonStyle.Secondary),
  );

  await interaction.update({ embeds: [embed], components: [...rows.slice(0, 4), backRow] });
}

async function handleChannelSelect(interaction, field) {
  const channelId = interaction.values[0];
  const config = await GuildConfig.findOne({ guildId: interaction.guildId });

  const fieldMap = {
    panel: 'panelChannelId',
    ticketcat: 'ticketCategoryId',
    archivecat: 'archiveCategoryId',
    logs: 'logsChannelId',
    feedback: 'feedbackChannelId',
  };

  const key = fieldMap[field];
  if (key) {
    config.channels[key] = channelId;
    await config.save();
  }

  await showChannelSetup(interaction, config);
}

module.exports = { showChannelSetup, handleChannelSelect };
