const { Schema, model } = require('mongoose');

const answerSchema = new Schema({
  question: String,
  answer: String,
}, { _id: false });

const ticketSchema = new Schema({
  guildId: { type: String, required: true },
  channelId: { type: String, required: true, unique: true },
  ticketNumber: { type: Number, required: true },
  categoryId: { type: String, default: null },
  categoryName: { type: String, default: '' },
  creatorId: { type: String, required: true },
  claimedById: { type: String, default: null },
  assistingStaffIds: { type: [String], default: [] },
  memberIds: { type: [String], default: [] },
  status: { type: String, enum: ['open', 'closed', 'archived'], default: 'open' },
  priority: { type: String, enum: ['none', 'low', 'medium', 'high', 'urgent'], default: 'none' },
  locked: { type: Boolean, default: false },
  answers: { type: [answerSchema], default: [] },
  openedAt: { type: Date, default: Date.now },
  closedAt: { type: Date, default: null },
  closedById: { type: String, default: null },
  autoCloseAt: { type: Date, default: null },
  controlMessageId: { type: String, default: null },
  feedbackRating: { type: Number, default: null },
  feedbackComment: { type: String, default: null },
});

ticketSchema.index({ guildId: 1, status: 1 });
ticketSchema.index({ creatorId: 1, guildId: 1, status: 1 });
ticketSchema.index({ autoCloseAt: 1, status: 1 });

module.exports = model('Ticket', ticketSchema);
