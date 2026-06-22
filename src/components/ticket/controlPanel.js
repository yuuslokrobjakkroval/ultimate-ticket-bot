const {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
} = require('discord.js');
const emojis = require('../../../emojis.json');

const PRIORITY_COLORS = {
  none: '#5865F2',
  low: '#23a55a',
  medium: '#fee75c',
  high: '#f0872a',
  urgent: '#f23f43',
};

function buildControlEmbed(ticket, creator, claimer) {
  const color = PRIORITY_COLORS[ticket.priority] || '#5865F2';
  const priorityText = ticket.priority !== 'none'
    ? `${emojis[`priority_${ticket.priority}`] || '🔴'} ${ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}`
    : 'None';

  const embed = new EmbedBuilder()
    .setTitle(`${emojis.ticket} Ticket #${ticket.ticketNumber}${ticket.categoryName ? ` — ${ticket.categoryName}` : ''}`)
    .setColor(color)
    .addFields(
      { name: 'Opened by', value: `<@${ticket.creatorId}>`, inline: true },
      { name: 'Status', value: ticket.locked ? `${emojis.lock} Locked` : `${emojis.open} Open`, inline: true },
      { name: 'Priority', value: priorityText, inline: true },
    )
    .setTimestamp(ticket.openedAt);

  if (ticket.claimedById) {
    embed.addFields({ name: 'Claimed by', value: `<@${ticket.claimedById}>`, inline: true });
  }
  if (ticket.answers && ticket.answers.length) {
    embed.addFields({
      name: 'Intake',
      value: ticket.answers.map(a => `**${a.question}**\n${a.answer}`).join('\n\n'),
      inline: false,
    });
  }

  return embed;
}

function buildControlRows(ticket, config) {
  const claimLabel = ticket.claimedById ? 'Unclaim' : 'Claim';
  const claimEmoji = ticket.claimedById ? emojis.unclaim : emojis.claim;
  const lockLabel = ticket.locked ? 'Unlock' : 'Lock';
  const lockEmoji = ticket.locked ? emojis.unlock : emojis.lock;

  const row1Btns = [
    new ButtonBuilder().setCustomId('ticket:close').setLabel('Close').setEmoji(emojis.close).setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('ticket:lock').setLabel(lockLabel).setEmoji(lockEmoji).setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('ticket:transcript').setLabel('Transcript').setEmoji(emojis.transcript).setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('ticket:add').setLabel('Add Member').setEmoji(emojis.addMember).setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('ticket:remove').setLabel('Remove Member').setEmoji(emojis.removeMember).setStyle(ButtonStyle.Secondary),
  ];

  if (config?.behavior?.claimingEnabled) {
    row1Btns.splice(1, 0,
      new ButtonBuilder().setCustomId('ticket:claim').setLabel(claimLabel).setEmoji(claimEmoji).setStyle(ButtonStyle.Primary),
    );
    row1Btns.splice(5); // keep max 5
  }

  const rows = [new ActionRowBuilder().addComponents(...row1Btns.slice(0, 5))];

  // Priority select
  rows.push(new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('ticket:priority')
      .setPlaceholder('Set priority...')
      .addOptions(
        new StringSelectMenuOptionBuilder().setLabel('No Priority').setValue('none').setEmoji('⬜'),
        new StringSelectMenuOptionBuilder().setLabel('Low').setValue('low').setEmoji(emojis.priority_low),
        new StringSelectMenuOptionBuilder().setLabel('Medium').setValue('medium').setEmoji(emojis.priority_medium),
        new StringSelectMenuOptionBuilder().setLabel('High').setValue('high').setEmoji(emojis.priority_high),
        new StringSelectMenuOptionBuilder().setLabel('Urgent').setValue('urgent').setEmoji(emojis.priority_urgent),
      ),
  ));

  return rows;
}

async function sendControlPanel(channel, ticket, config) {
  const embed = buildControlEmbed(ticket, null, null);
  const rows = buildControlRows(ticket, config);
  const msg = await channel.send({ embeds: [embed], components: rows });
  await msg.pin().catch(() => {});
  ticket.controlMessageId = msg.id;
  await ticket.save();
  return msg;
}

async function updateControlPanel(channel, ticket, config) {
  if (!ticket.controlMessageId) return sendControlPanel(channel, ticket, config);
  const msg = await channel.messages.fetch(ticket.controlMessageId).catch(() => null);
  if (!msg) return sendControlPanel(channel, ticket, config);
  const embed = buildControlEmbed(ticket, null, null);
  const rows = buildControlRows(ticket, config);
  await msg.edit({ embeds: [embed], components: rows });
}

module.exports = { buildControlEmbed, buildControlRows, sendControlPanel, updateControlPanel };
