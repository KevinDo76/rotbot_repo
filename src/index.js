// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits, MessageActivityType } = require('discord.js');
const { token } = require('./config.json');

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});


// Log in to Discord with your client's token
client.login(token);
client.on("ready", () => {
	console.log(client.application.id);
	start()
});


function start()
{
	let clientPingTag = "<@"+client.application.id+">";
	client.get
	client.on("messageCreate", async(message) => {
		if(message.content.toLowerCase().startsWith(clientPingTag)) {
		  let textContent = message.content.replace(clientPingTag, "");
		  message.channel.send({ content: `${message.author}`+message.member.displayName+": "+textContent });
		  console.log(textContent)
		}
	});

	
}