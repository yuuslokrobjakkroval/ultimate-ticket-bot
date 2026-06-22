const Ticket = require('../models/Ticket');
const GuildConfig = require('../models/GuildConfig');

let client;

async function runAutoClose() {
  const now = new Date();
  const due = await Ticket.find({ status: 'open', autoCloseAt: { $lte: now } });

  for (const ticket of due) {
    try {
      const guild = await client.guilds.fetch(ticket.guildId).catch(() => null);
      if (!guild) continue;
      const channel = await guild.channels.fetch(ticket.channelId).catch(() => null);
      if (!channel) {
        ticket.status = 'closed';
        ticket.closedAt = now;
        ticket.closedById = client.user.id;
        await ticket.save();
        continue;
      }

      const { closeTicketChannel } = require('../components/ticket/closeTicket');
      await closeTicketChannel(guild, channel, ticket, null, 'auto-close');
    } catch (err) {
      console.error(`[AUTO-CLOSE] Ticket ${ticket.channelId}:`, err.message);
    }
  }
}

function startAutoClose(botClient) {
  client = botClient;
  setInterval(runAutoClose, 5 * 60 * 1000); // check every 5 minutes
  console.log('[AUTO-CLOSE] Timer started (5min interval)');
}

async function scheduleAutoClose(ticket, config) {
  if (!config.behavior.autoCloseEnabled) {
    ticket.autoCloseAt = null;
    return;
  }
  const ms = config.behavior.autoCloseHours * 60 * 60 * 1000;
  ticket.autoCloseAt = new Date(Date.now() + ms);
}

async function refreshAutoClose(ticket, config) {
  await scheduleAutoClose(ticket, config);
  await ticket.save();
}

module.exports = { startAutoClose, scheduleAutoClose, refreshAutoClose };
