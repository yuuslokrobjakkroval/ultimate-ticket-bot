const { AttachmentBuilder } = require('discord.js');

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatTimestamp(date) {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function priorityBadge(priority) {
  const map = { none: '', low: '🟢 Low', medium: '🟡 Medium', high: '🟠 High', urgent: '🔴 Urgent' };
  return map[priority] || '';
}

function renderMessage(msg) {
  if (msg.author.bot && !msg.embeds.length && !msg.content) return '';
  const avatar = msg.author.displayAvatarURL?.({ size: 32, extension: 'png' }) || '';
  const content = msg.content ? escapeHtml(msg.content).replace(/\n/g, '<br>') : '';
  const attachments = [...msg.attachments.values()].map(a =>
    a.contentType?.startsWith('image/')
      ? `<img src="${escapeHtml(a.url)}" class="attachment-img" alt="${escapeHtml(a.name)}">`
      : `<a href="${escapeHtml(a.url)}" class="attachment-link">${escapeHtml(a.name)}</a>`,
  ).join('');
  const embeds = msg.embeds.map(e =>
    `<div class="embed" style="border-left-color:${e.color ? '#' + e.color.toString(16).padStart(6, '0') : '#4f545c'}">
      ${e.title ? `<div class="embed-title">${escapeHtml(e.title)}</div>` : ''}
      ${e.description ? `<div class="embed-desc">${escapeHtml(e.description).replace(/\n/g, '<br>')}</div>` : ''}
    </div>`,
  ).join('');

  return `
    <div class="message">
      <img class="avatar" src="${escapeHtml(avatar)}" alt="">
      <div class="msg-body">
        <span class="username">${escapeHtml(msg.author.tag || msg.author.username)}</span>
        <span class="timestamp">${formatTimestamp(msg.createdAt)}</span>
        ${content ? `<div class="content">${content}</div>` : ''}
        ${attachments}
        ${embeds}
      </div>
    </div>`;
}

async function generateTranscript(channel, ticket, guild) {
  const messages = [];
  let before = null;

  while (true) {
    const fetched = await channel.messages.fetch({ limit: 100, ...(before ? { before } : {}) });
    if (!fetched.size) break;
    messages.push(...fetched.values());
    before = fetched.last().id;
    if (fetched.size < 100) break;
  }

  messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

  const messageHtml = messages.map(renderMessage).join('');

  const answerRows = (ticket.answers || []).map(a =>
    `<tr><td class="q-cell">${escapeHtml(a.question)}</td><td>${escapeHtml(a.answer)}</td></tr>`,
  ).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Ticket #${ticket.ticketNumber} — ${escapeHtml(guild.name)}</title>
<style>
  :root { --bg: #313338; --bg2: #2b2d31; --bg3: #1e1f22; --text: #dcddde; --muted: #949ba4; --accent: #5865f2; --success: #23a55a; --danger: #f23f43; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--bg); color: var(--text); font-family: 'gg sans', 'Noto Sans', Whitney, system-ui, sans-serif; font-size: 14px; }
  header { background: var(--bg3); padding: 24px 32px; border-bottom: 1px solid #1a1b1e; }
  header h1 { font-size: 22px; font-weight: 700; color: #fff; margin-bottom: 4px; }
  header .meta { color: var(--muted); font-size: 13px; }
  .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
  .badge { background: var(--accent); color: #fff; border-radius: 4px; padding: 2px 8px; font-size: 12px; font-weight: 600; }
  .badge.success { background: var(--success); }
  .badge.danger { background: var(--danger); }
  .badge.neutral { background: #4e5058; }
  .info-table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  .info-table td { padding: 6px 0; font-size: 13px; vertical-align: top; }
  .info-table td:first-child { color: var(--muted); width: 160px; }
  .answers { background: var(--bg2); border-radius: 8px; margin: 0 32px 0 32px; padding: 16px; margin-top: 16px; }
  .answers h3 { font-size: 13px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: .5px; margin-bottom: 12px; }
  .answers table { width: 100%; border-collapse: collapse; }
  .q-cell { color: var(--muted); padding-right: 16px; width: 200px; vertical-align: top; padding-bottom: 8px; }
  .messages { padding: 16px 32px; }
  .message { display: flex; gap: 12px; padding: 4px 0 4px; }
  .message:hover { background: rgba(255,255,255,.02); border-radius: 4px; padding-left: 4px; margin-left: -4px; }
  .avatar { width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
  .msg-body { flex: 1; min-width: 0; }
  .username { font-weight: 600; color: #fff; font-size: 14px; margin-right: 8px; }
  .timestamp { color: var(--muted); font-size: 11px; }
  .content { color: var(--text); line-height: 1.5; margin-top: 2px; word-break: break-word; }
  .attachment-img { max-width: 400px; max-height: 300px; border-radius: 4px; margin-top: 4px; display: block; }
  .attachment-link { color: var(--accent); text-decoration: none; font-size: 13px; }
  .embed { border-left: 4px solid #4f545c; background: #2b2d31; border-radius: 0 4px 4px 0; padding: 8px 12px; margin-top: 4px; max-width: 520px; }
  .embed-title { font-weight: 600; color: #fff; font-size: 14px; margin-bottom: 4px; }
  .embed-desc { color: var(--text); font-size: 14px; line-height: 1.4; }
  footer { text-align: center; padding: 24px; color: var(--muted); font-size: 12px; border-top: 1px solid #1a1b1e; }
</style>
</head>
<body>
<header>
  <h1>🎫 Ticket #${ticket.ticketNumber}${ticket.categoryName ? ` — ${escapeHtml(ticket.categoryName)}` : ''}</h1>
  <div class="meta">${escapeHtml(guild.name)}</div>
  <div class="badges">
    <span class="badge ${ticket.status === 'closed' ? 'danger' : 'success'}">${ticket.status.toUpperCase()}</span>
    ${ticket.priority !== 'none' ? `<span class="badge neutral">${priorityBadge(ticket.priority)}</span>` : ''}
    ${ticket.claimedById ? `<span class="badge neutral">Claimed</span>` : ''}
  </div>
  <table class="info-table">
    <tr><td>Opened by</td><td>${escapeHtml(ticket.creatorId)}</td></tr>
    <tr><td>Opened at</td><td>${formatTimestamp(ticket.openedAt)}</td></tr>
    ${ticket.closedAt ? `<tr><td>Closed at</td><td>${formatTimestamp(ticket.closedAt)}</td></tr>` : ''}
    ${ticket.closedById ? `<tr><td>Closed by</td><td>${escapeHtml(ticket.closedById)}</td></tr>` : ''}
    ${ticket.claimedById ? `<tr><td>Claimed by</td><td>${escapeHtml(ticket.claimedById)}</td></tr>` : ''}
    ${ticket.assistingStaffIds.length ? `<tr><td>Assisting staff</td><td>${ticket.assistingStaffIds.map(escapeHtml).join(', ')}</td></tr>` : ''}
    <tr><td>Total messages</td><td>${messages.length}</td></tr>
  </table>
</header>
${answerRows ? `<div class="answers"><h3>Intake Questions</h3><table>${answerRows}</table></div>` : ''}
<div class="messages">${messageHtml}</div>
<footer>Generated by Ultimate Ticket Bot · ${formatTimestamp(new Date())}</footer>
</body>
</html>`;

  const buffer = Buffer.from(html, 'utf-8');
  return new AttachmentBuilder(buffer, { name: `ticket-${ticket.ticketNumber}.html` });
}

module.exports = { generateTranscript };
