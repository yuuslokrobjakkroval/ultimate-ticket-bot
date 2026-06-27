const { startAutoClose } = require("../utils/autoClose");

module.exports = {
  name: "clientReady",
  once: true,
  async execute(client) {
    console.log(`[BOT] Logged in as ${client.user.tag}`);
    client.user.setActivity("Support Tickets", { type: 3 }); // WATCHING
    startAutoClose(client);
  },
};
