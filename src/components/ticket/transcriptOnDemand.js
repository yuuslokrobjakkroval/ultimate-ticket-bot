const Ticket = require('../../models/Ticket');
const { requireStaff } = require('../../utils/permissions');
const { generateTranscript } = require('../../utils/transcript');
const emojis = require('../../../emojis.json');

async function handleTranscript(interaction) {
  if (!await requireStaff(interaction)) return;
  await interaction.deferReply({ ephemeral: true });

  const ticket = await Ticket.findOne({ channelId: interaction.channelId });
  if (!ticket) return interaction.editReply({ content: '❌ Ticket not found.' });

  const file = await generateTranscript(interaction.channel, ticket, interaction.guild).catch(() => null);
  if (!file) return interaction.editReply({ content: '❌ Failed to generate transcript.' });

  await interaction.editReply({
    content: `${emojis.transcript} Transcript for Ticket #${ticket.ticketNumber}:`,
    files: [file],
  });
}

module.exports = { handleTranscript };
