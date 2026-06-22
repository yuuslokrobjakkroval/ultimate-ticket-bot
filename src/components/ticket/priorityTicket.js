const GuildConfig = require('../../models/GuildConfig');
const Ticket = require('../../models/Ticket');
const { requireStaff } = require('../../utils/permissions');
const { updateControlPanel } = require('./controlPanel');
const emojis = require('../../../emojis.json');

const PRIORITY_LABELS = { none: 'None', low: '🟢 Low', medium: '🟡 Medium', high: '🟠 High', urgent: '🔴 Urgent' };

async function handlePriority(interaction) {
  if (!await requireStaff(interaction)) return;

  const ticket = await Ticket.findOne({ channelId: interaction.channelId, status: 'open' });
  if (!ticket) return interaction.reply({ content: '❌ Ticket not found.', ephemeral: true });

  const priority = interaction.values[0];
  ticket.priority = priority;
  await ticket.save();

  const config = await GuildConfig.findOne({ guildId: interaction.guildId });
  await interaction.reply({ content: `${emojis.priority} Priority set to **${PRIORITY_LABELS[priority]}**.`, ephemeral: true });
  await updateControlPanel(interaction.channel, ticket, config);
}

module.exports = { handlePriority };
