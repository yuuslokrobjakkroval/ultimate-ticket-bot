const GuildConfig = require('../../models/GuildConfig');
const Ticket = require('../../models/Ticket');
const { requireStaff } = require('../../utils/permissions');
const { updateControlPanel } = require('./controlPanel');
const emojis = require('../../../emojis.json');

async function handleClaim(interaction) {
  if (!await requireStaff(interaction)) return;

  const ticket = await Ticket.findOne({ channelId: interaction.channelId, status: 'open' });
  if (!ticket) return interaction.reply({ content: '❌ Ticket not found.', ephemeral: true });

  const config = await GuildConfig.findOne({ guildId: interaction.guildId });

  if (ticket.claimedById === interaction.user.id) {
    ticket.claimedById = null;
    ticket.assistingStaffIds = ticket.assistingStaffIds.filter(id => id !== interaction.user.id);
    await ticket.save();
    await interaction.reply({ content: `${emojis.unclaim} You have unclaimed this ticket.`, ephemeral: true });
  } else {
    if (ticket.claimedById) {
      return interaction.reply({ content: `❌ This ticket is already claimed by <@${ticket.claimedById}>.`, ephemeral: true });
    }
    ticket.claimedById = interaction.user.id;
    if (!ticket.assistingStaffIds.includes(interaction.user.id)) {
      ticket.assistingStaffIds.push(interaction.user.id);
    }
    await ticket.save();
    await interaction.reply({ content: `${emojis.claim} You have claimed this ticket.`, ephemeral: true });
  }

  await updateControlPanel(interaction.channel, ticket, config);
}

module.exports = { handleClaim };
