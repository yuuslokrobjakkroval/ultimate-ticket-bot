const { PermissionsBitField } = require('discord.js');
const GuildConfig = require('../../models/GuildConfig');
const Ticket = require('../../models/Ticket');
const { requireStaff } = require('../../utils/permissions');
const { updateControlPanel } = require('./controlPanel');
const emojis = require('../../../emojis.json');

async function handleLock(interaction) {
  if (!await requireStaff(interaction)) return;

  const ticket = await Ticket.findOne({ channelId: interaction.channelId, status: 'open' });
  if (!ticket) return interaction.reply({ content: '❌ Ticket not found.', ephemeral: true });

  const config = await GuildConfig.findOne({ guildId: interaction.guildId });
  ticket.locked = !ticket.locked;
  await ticket.save();

  await interaction.channel.permissionOverwrites.edit(ticket.creatorId, {
    SendMessages: ticket.locked ? false : true,
  }).catch(() => {});

  for (const memberId of ticket.memberIds) {
    await interaction.channel.permissionOverwrites.edit(memberId, {
      SendMessages: ticket.locked ? false : true,
    }).catch(() => {});
  }

  await interaction.reply({
    content: ticket.locked
      ? `${emojis.lock} Ticket locked. Only staff can send messages.`
      : `${emojis.unlock} Ticket unlocked.`,
    ephemeral: false,
  });

  await updateControlPanel(interaction.channel, ticket, config);
}

module.exports = { handleLock };
