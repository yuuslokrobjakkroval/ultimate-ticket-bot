const { handleOpenButton, handleCategorySelect, handleQuestionsModal } = require('./openTicket');
const { handleCloseButton, handleCloseConfirm, handleFeedback } = require('./closeTicket');
const { handleClaim } = require('./claimTicket');
const { handleLock } = require('./lockTicket');
const { handlePriority } = require('./priorityTicket');
const { handleAddMember, handleAddMemberSave, handleRemoveMember, handleRemoveMemberSave } = require('./memberManagement');
const { handleTranscript } = require('./transcriptOnDemand');

async function handle(interaction, parts) {
  const [action, sub, extra, id] = parts;

  if (action === 'open') return handleOpenButton(interaction);
  if (action === 'category') return handleCategorySelect(interaction);
  if (action === 'questions') return handleQuestionsModal(interaction, sub); // sub = categoryId

  if (action === 'close') {
    if (!sub) return handleCloseButton(interaction);
    if (sub === 'confirm') return handleCloseConfirm(interaction);
    if (sub === 'cancel') return interaction.update({ content: '↩️ Close cancelled.', components: [], embeds: [] });
  }

  if (action === 'feedback') return handleFeedback(interaction, sub, extra); // sub=ticketId, extra=rating

  if (action === 'claim') return handleClaim(interaction);
  if (action === 'lock') return handleLock(interaction);
  if (action === 'priority') return handlePriority(interaction);

  if (action === 'add') {
    if (!sub) return handleAddMember(interaction);
    if (sub === 'save') return handleAddMemberSave(interaction);
  }

  if (action === 'remove') {
    if (!sub) return handleRemoveMember(interaction);
    if (sub === 'save') return handleRemoveMemberSave(interaction);
  }

  if (action === 'transcript') return handleTranscript(interaction);
}

module.exports = { handle };
