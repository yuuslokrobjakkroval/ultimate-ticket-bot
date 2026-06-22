const {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  RoleSelectMenuBuilder, UserSelectMenuBuilder,
} = require('discord.js');
const GuildConfig = require('../../models/GuildConfig');
const emojis = require('../../../emojis.json');

function buildStaffEmbed(config) {
  const s = config.staff;
  return new EmbedBuilder()
    .setTitle(`${emojis.staff} Staff & Ping Configuration`)
    .setDescription('Set which roles can manage tickets and who gets pinged when a new ticket opens.')
    .setColor('#5865F2')
    .addFields(
      {
        name: '🛡️ Support Roles',
        value: s.supportRoleIds.length
          ? s.supportRoleIds.map(id => `<@&${id}>`).join(', ')
          : '*(none set)*',
        inline: false,
      },
      {
        name: '🔔 Ping Roles on New Ticket',
        value: s.pingRoleIds.length
          ? s.pingRoleIds.map(id => `<@&${id}>`).join(', ')
          : '*(none)*',
        inline: true,
      },
      {
        name: '🔔 Ping Users on New Ticket',
        value: s.pingUserIds.length
          ? s.pingUserIds.map(id => `<@${id}>`).join(', ')
          : '*(none)*',
        inline: true,
      },
    );
}

function buildStaffRows() {
  return [
    new ActionRowBuilder().addComponents(
      new RoleSelectMenuBuilder()
        .setCustomId('setup:staff:support')
        .setPlaceholder('Select support roles (can manage tickets)')
        .setMinValues(0).setMaxValues(10),
    ),
    new ActionRowBuilder().addComponents(
      new RoleSelectMenuBuilder()
        .setCustomId('setup:staff:pingroles')
        .setPlaceholder('Select roles to ping on new ticket (optional)')
        .setMinValues(0).setMaxValues(10),
    ),
    new ActionRowBuilder().addComponents(
      new UserSelectMenuBuilder()
        .setCustomId('setup:staff:pingusers')
        .setPlaceholder('Select users to ping on new ticket (optional)')
        .setMinValues(0).setMaxValues(10),
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('setup:main').setLabel('Back').setEmoji(emojis.back).setStyle(ButtonStyle.Secondary),
    ),
  ];
}

async function showStaffSetup(interaction, config) {
  if (!config) config = await GuildConfig.findOne({ guildId: interaction.guildId });
  await interaction.update({ embeds: [buildStaffEmbed(config)], components: buildStaffRows() });
}

async function handleStaffSelect(interaction, field) {
  const config = await GuildConfig.findOne({ guildId: interaction.guildId });
  const values = interaction.values;

  if (field === 'support') config.staff.supportRoleIds = values;
  else if (field === 'pingroles') config.staff.pingRoleIds = values;
  else if (field === 'pingusers') config.staff.pingUserIds = values;

  await config.save();
  await showStaffSetup(interaction, config);
}

module.exports = { showStaffSetup, handleStaffSelect };
