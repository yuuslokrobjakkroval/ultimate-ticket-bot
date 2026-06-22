const {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
} = require('discord.js');
const GuildConfig = require('../../models/GuildConfig');
const { showMainDashboard } = require('./mainDashboard');
const emojis = require('../../../emojis.json');

function buildLivePanelEmbed(config) {
  const p = config.panel;
  const embed = new EmbedBuilder()
    .setTitle(p.title || 'Support Tickets')
    .setDescription(p.description || 'Click the button below to open a support ticket.')
    .setColor(p.color || '#5865F2');
  if (p.footer) embed.setFooter({ text: p.footer, iconURL: p.footerIcon || undefined });
  if (p.author) embed.setAuthor({ name: p.author, iconURL: p.authorIcon || undefined });
  if (p.thumbnail) embed.setThumbnail(p.thumbnail);
  if (p.image) embed.setImage(p.image);
  return embed;
}

function buildLivePanelRow(config) {
  const p = config.panel;
  const btn = new ButtonBuilder()
    .setCustomId('ticket:open')
    .setLabel(p.buttonLabel || 'Open Ticket')
    .setStyle(ButtonStyle.Primary);
  if (p.buttonEmoji) btn.setEmoji(p.buttonEmoji);
  return new ActionRowBuilder().addComponents(btn);
}

async function deployPanel(interaction) {
  await interaction.deferUpdate();
  const config = await GuildConfig.findOne({ guildId: interaction.guildId });

  if (!config.channels.panelChannelId) {
    return interaction.followUp({ content: '❌ Set a panel channel first (Channels section).', ephemeral: true });
  }

  const channel = await interaction.guild.channels.fetch(config.channels.panelChannelId).catch(() => null);
  if (!channel) {
    return interaction.followUp({ content: '❌ Could not find the panel channel. It may have been deleted.', ephemeral: true });
  }

  const embed = buildLivePanelEmbed(config);
  const row = buildLivePanelRow(config);

  if (config.panelMessageId) {
    const old = await channel.messages.fetch(config.panelMessageId).catch(() => null);
    if (old) {
      await old.edit({ embeds: [embed], components: [row] });
      await showMainDashboard(interaction, config);
      return interaction.followUp({ content: `${emojis.success} Panel updated in <#${channel.id}>.`, ephemeral: true });
    }
  }

  const msg = await channel.send({ embeds: [embed], components: [row] });
  config.panelMessageId = msg.id;
  await config.save();

  await showMainDashboard(interaction, config);
  await interaction.followUp({ content: `${emojis.success} Panel deployed to <#${channel.id}>!`, ephemeral: true });
}

module.exports = { deployPanel, buildLivePanelEmbed, buildLivePanelRow };
