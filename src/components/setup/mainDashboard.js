const {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
} = require('discord.js');
const GuildConfig = require('../../models/GuildConfig');
const emojis = require('../../../emojis.json');

function buildMainEmbed(config, guild) {
  const hasPanel = !!config.channels.panelChannelId;
  const hasCategories = config.categories.length > 0;
  const hasStaff = config.staff.supportRoleIds.length > 0;
  const hasBehavior = true;

  const status = (ok) => ok ? '✅' : '⚠️';

  return new EmbedBuilder()
    .setTitle(`${emojis.settings} Ticket System Setup`)
    .setDescription('Configure every aspect of your ticket system below. Changes save instantly.')
    .setColor('#5865F2')
    .addFields(
      {
        name: `${emojis.panel} Panel`,
        value: `Title: **${config.panel.title}**\nColor: \`${config.panel.color}\``,
        inline: true,
      },
      {
        name: `${emojis.channels} Channels ${status(hasPanel)}`,
        value: hasPanel
          ? `Panel: <#${config.channels.panelChannelId}>`
          : '⚠️ Panel channel not set',
        inline: true,
      },
      {
        name: `${emojis.categories} Categories ${status(hasCategories)}`,
        value: hasCategories
          ? config.categories.map(c => `${c.emoji} ${c.name}`).join('\n')
          : '⚠️ No categories yet',
        inline: true,
      },
      {
        name: `${emojis.staff} Staff ${status(hasStaff)}`,
        value: hasStaff
          ? `${config.staff.supportRoleIds.length} support role(s)`
          : '⚠️ No support roles set',
        inline: true,
      },
      {
        name: `${emojis.behavior} Behavior`,
        value: [
          `Claiming: ${config.behavior.claimingEnabled ? '✅' : '❌'}`,
          `Feedback: ${config.behavior.feedbackEnabled ? '✅' : '❌'}`,
          `Auto-close: ${config.behavior.autoCloseEnabled ? `✅ ${config.behavior.autoCloseHours}h` : '❌'}`,
        ].join(' · '),
        inline: true,
      },
      {
        name: `${emojis.deploy} Deploy`,
        value: config.panelMessageId ? '✅ Panel is live' : '⚠️ Panel not deployed',
        inline: true,
      },
    )
    .setFooter({ text: `Server: ${guild.name}` })
    .setTimestamp();
}

function buildMainRows() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('setup:panel').setLabel('Edit Panel').setEmoji(emojis.panel).setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('setup:channels').setLabel('Channels').setEmoji(emojis.channels).setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('setup:categories').setLabel('Categories').setEmoji(emojis.categories).setStyle(ButtonStyle.Primary),
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('setup:staff').setLabel('Staff & Pings').setEmoji(emojis.staff).setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('setup:behavior').setLabel('Behavior').setEmoji(emojis.behavior).setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('setup:deploy').setLabel('Deploy Panel').setEmoji(emojis.deploy).setStyle(ButtonStyle.Success),
    ),
  ];
}

async function showMainDashboard(interaction, config) {
  if (!config) config = await GuildConfig.findOne({ guildId: interaction.guildId });
  const embed = buildMainEmbed(config, interaction.guild);
  const rows = buildMainRows();

  if (interaction.deferred || interaction.replied) {
    await interaction.editReply({ embeds: [embed], components: rows });
  } else {
    await interaction.update({ embeds: [embed], components: rows });
  }
}

module.exports = { showMainDashboard, buildMainEmbed, buildMainRows };
