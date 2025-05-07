// Require the necessary discord.js classes
const required_model = 'qwen3:4b';
const { Client, Events, GatewayIntentBits, MessageActivityType } = require('discord.js');
const { token } = require('./config.json');
const ollama_interact = require('./ollama_interact/ollama_interact.js')

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
	ollama_setup();
	start();
});

async function ollama_setup()
{
	let result;
	let found = false;
	try {
		result = await ollama_interact.get_downloaded_models()
	} catch (error) {
		console.error('Error:', error);
		throw error;
	}
	for (let i=0;i<result['models'].length;i++)
	{
		console.log("Model found: "+result['models'][i]['name']);
		if (result['models'][i]['name'] === required_model)
		{
			found=true;
		}
	}

	if (!found)
	{
		throw "Model not installed";
	}

	let load_result = await ollama_interact.load_model(required_model);
	if (!load_result['done'])
	{
		throw "failure to load";
	}
	console.log("Loaded model "+load_result['model']);
}

async function start()
{
	let clientPingTag = "<@"+client.application.id+">";
	client.on("messageCreate", async(message) => {
		if(message.content.toLowerCase().startsWith(clientPingTag)) {
			let textContent = message.content.replace(clientPingTag, "").trimStart();
			let typingInterval = setInterval(() => {message.channel.sendTyping()}, 2000);
			try {
				let generate_result = await  ollama_interact.message_send(required_model, textContent);
				if (generate_result["response"].length > 2000)
				{
					throw "Reponse too long error! length: "+generate_result["response"].length;
				}
				message.channel.send({ content: generate_result["response"] });
			} catch (error) {
				message.channel.send({ content: error });
			}
			clearInterval(typingInterval);
			// message.channel.send({ content: `${message.author}`+message.member.displayName+': '+textContent });
		}
	});	
}

