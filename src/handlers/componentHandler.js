const setupHandlers = require('../components/setup');
const ticketHandlers = require('../components/ticket');

async function handleComponent(interaction) {
  const [domain, ...rest] = interaction.customId.split(':');

  try {
    if (domain === 'setup') return await setupHandlers.handle(interaction, rest);
    if (domain === 'ticket') return await ticketHandlers.handle(interaction, rest);
  } catch (err) {
    console.error(`[COMPONENT ERROR] ${interaction.customId}`, err);
    const msg = { content: '❌ Something went wrong. Please try again.', ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(msg).catch(() => {});
    } else {
      await interaction.reply(msg).catch(() => {});
    }
  }
}

module.exports = { handleComponent };
