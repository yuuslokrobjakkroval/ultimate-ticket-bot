# 🎫 Ultimate Ticket Bot | Fully Customizable Discord Support System

> **The Most Customizable Discord Ticket System | One Command, Total Control**

Stop juggling five different commands and a config file just to set up support tickets. This system gives you **one slash command** — `/ticket-setup` — that opens a full interactive dashboard with buttons, dropdowns, and forms for every single setting. No code editing, no restarting the bot, no guesswork.

---

## ✨ Features

### 🎨 Fully Custom Panel
Edit your ticket panel's title, description, color, footer, author, thumbnail, and image — all from Discord. Live preview before you send it.

### 🗂️ Unlimited Ticket Categories
Add as many categories as you want, each with its own emoji, description, and up to **2 custom questions** asked before the ticket opens (e.g. *"What's your order number?"*).

### 📁 Full Channel Control
Set your panel channel, ticket category, archive category, and transcript/logs channel — all via dropdown, no typing IDs.

### 👥 Staff & Routing
Assign support roles and choose exactly who gets pinged (roles or users) when a new ticket opens.

### ⚙️ Deep Behavior Settings
Toggle claiming, feedback collection, auto-close, delete-vs-archive on close, and lock-on-close. Set max open tickets per user and a custom channel naming format.

### 🔒 Real Ticket Management
Claim/unclaim, lock/unlock, set priority (Low / Medium / High / Urgent), add or remove members, and close with a confirmation step — all with your own custom emojis.

### 📑 Professional HTML Transcripts
Every closed (or on-demand) transcript is a polished, downloadable HTML file with full ticket metadata (creator, assisting staff, category, dates), sent to your logs channel and DM'd to the ticket opener.

### ⭐ Built-in Feedback System
After closing, the ticket opener gets a DM to rate their experience 1–5 stars. Results are posted automatically to a dedicated feedback channel with full context (who opened it, who handled it).

### 🕐 Auto-Close
Automatically closes inactive tickets after a configurable number of hours.

### 🖌️ One-File Emoji Branding
Every emoji in the entire system is controlled from a single `emojis.json` file. Want your own custom emojis throughout? Edit one file — zero code knowledge required.

### 💾 Persistent, Per-Server Config
Powered by MongoDB. Your settings survive restarts and updates, and every server using the bot gets its own independent configuration.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher
- A [MongoDB](https://www.mongodb.com/) database (local or Atlas)
- A Discord application with a bot token ([Discord Developer Portal](https://discord.com/developers/applications))

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/yuuslokrobjakkroval/ultimate-ticket-bot.git
cd ultimate-ticket-bot
```

**2. Install dependencies**
```bash
npm install
```

**3. Configure environment**
```bash
cp .env.example .env
```
Open `.env` and fill in your values:
```env
BOT_TOKEN=your_bot_token_here
CLIENT_ID=your_application_client_id
MONGODB_URI=mongodb://localhost:27017/ticket-bot
```

**4. Start the bot**
```bash
npm start
```

---

## 🛠️ Setup Guide

Once the bot is running and invited to your server:

1. Run `/ticket-setup` (requires **Manage Server** permission)
2. Use the interactive dashboard to configure each section:
   - **Edit Panel** — customize the look of your ticket panel embed
   - **Channels** — set where tickets open, archive, and logs go
   - **Categories** — add ticket types with custom questions
   - **Staff & Pings** — assign support roles and ping targets
   - **Behavior** — toggle features and set limits
3. Click **Deploy Panel** to send the live panel to your chosen channel
4. Done — users can now open tickets by clicking the button

---

## 📁 Project Structure

```
ultimate-ticket-bot/
├── src/
│   ├── commands/           # Slash commands
│   ├── components/
│   │   ├── setup/          # Setup dashboard (panel, channels, categories, staff, behavior)
│   │   └── ticket/         # Ticket lifecycle (open, close, claim, lock, priority, members)
│   ├── events/             # Discord.js event handlers
│   ├── handlers/           # Command, event, and component loaders
│   ├── models/             # Mongoose schemas (GuildConfig, Ticket)
│   ├── utils/              # Transcript generator, permissions, auto-close
│   └── index.js            # Entry point
├── emojis.json             # ← Edit this to change every emoji in the bot
├── .env.example
└── package.json
```

---

## ⚙️ Configuration Reference

### Behavior Toggles

| Setting | Default | Description |
|---|---|---|
| Claiming | ✅ On | Staff can claim/unclaim tickets |
| Feedback | ✅ On | DM star rating after close |
| Auto-Close | ❌ Off | Close inactive tickets automatically |
| Delete on Close | ❌ Off | Off = move to archive category |
| Lock on Close | ❌ Off | Prevent messages after closing |
| Max Tickets/User | `1` | Max simultaneous open tickets per user |
| Naming Format | `ticket-{username}` | Channel name template |

### Channel Naming Tokens

| Token | Replaced with |
|---|---|
| `{username}` | User's Discord username |
| `{userid}` | User's Discord ID |
| `{number}` | Ticket number (zero-padded) |
| `{category}` | Category name |

---

## 🔧 Tech Stack

- **[Discord.js](https://discord.js.org/) v14** — slash commands, buttons, modals, select menus
- **[Mongoose](https://mongoosejs.com/)** — MongoDB ODM for persistent per-server config
- **Node.js** — runtime

---

## 👤 Author

**yuuslokrobjakkroval**

| Platform | Link |
|---|---|
| Discord | [yuuslokrobjakkroval](https://discord.com/users/966688007493140591) |
| GitHub | [yuuslokrobjakkroval](https://github.com/yuuslokrobjakkroval) |
| Twitter / X | [yuuslokrobjakkroval](https://twitter.com/yuuslokrobjakkroval) |
| Instagram | [yuuslokrobjakkroval](https://instagram.com/yuuslokrobjakkroval) |
| TikTok | [yuuslokrobjakkroval](https://tiktok.com/@yuuslokrobjakkroval) |
| YouTube | [yuuslokrobjakkroval](https://youtube.com/@yuuslokrobjakkroval) |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">
  Built by <strong>yuuslokrobjakkroval</strong>
</div>
