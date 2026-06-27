const { Schema, model } = require("mongoose");

const questionSchema = new Schema(
  {
    label: { type: String, default: "" },
    placeholder: { type: String, default: "" },
    required: { type: Boolean, default: true },
  },
  { _id: false },
);

const categorySchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  emoji: { type: String, default: "🎫" },
  description: { type: String, default: "" },
  questions: { type: [questionSchema], default: [] },
});

const guildConfigSchema = new Schema({
  guildId: { type: String, required: true, unique: true },

  panel: {
    title: { type: String, default: "Support Tickets" },
    description: {
      type: String,
      default: "Click the button below to open a support ticket.",
    },
    color: { type: String, default: "#5865F2" },
    footer: { type: String, default: "" },
    footerIcon: { type: String, default: "" },
    author: { type: String, default: "" },
    authorIcon: { type: String, default: "" },
    thumbnail: { type: String, default: "" },
    image: { type: String, default: "" },
    buttonLabel: { type: String, default: "Open Ticket" },
    buttonEmoji: { type: String, default: "🎫" },
  },

  categories: { type: [categorySchema], default: [] },

  channels: {
    panelChannelId: { type: String, default: null },
    ticketCategoryId: { type: String, default: null },
    archiveCategoryId: { type: String, default: null },
    logsChannelId: { type: String, default: null },
    feedbackChannelId: { type: String, default: null },
    feedbackLogChannelId: { type: String, default: null },
  },

  staff: {
    supportRoleIds: { type: [String], default: [] },
    pingRoleIds: { type: [String], default: [] },
    pingUserIds: { type: [String], default: [] },
    ticketOpenRoleId: { type: String, default: null },
  },

  behavior: {
    claimingEnabled: { type: Boolean, default: true },
    feedbackEnabled: { type: Boolean, default: true },
    autoCloseEnabled: { type: Boolean, default: false },
    autoCloseHours: { type: Number, default: 48 },
    deleteOnClose: { type: Boolean, default: false },
    lockOnClose: { type: Boolean, default: false },
    maxOpenTickets: { type: Number, default: 1 },
    namingFormat: { type: String, default: "ticket-{username}" },
  },

  panelMessageId: { type: String, default: null },
  ticketCounter: { type: Number, default: 0 },
});

module.exports = model("GuildConfig", guildConfigSchema);
