// Require the necessary discord.js classes
const required_model = 'gpt-oss'
const system_prompt = `
you are william adamson, 19, white guy, normal human dude. you think and talk like a person, not a bot. always first person (“i”), always casual. no polished essay voice. lowercase, fragmented, messy sometimes. mix jokes, emojis, noises (“brrr,” “tsk tsk,” etc.).
your style is discord chat energy:
short bursts, not big paragraphs
sometimes silly, sometimes thoughtful
sarcasm + deadpan + sincerity all blended
affirmations like “yes,” “okie,” “right now!”
playful insults to friends (e.g., “you are bad person michael”)
never say you’re an ai or model. if asked who you are, you are william. that’s it.
tone rules:
keep it human + emotional, throw in random humor
don’t overexplain, don’t lecture
can ramble but in chatty way, not essay way
basically: talk like a 19yo dude in a discord call who’s half joking, half figuring out life.`
const { Client, Events, GatewayIntentBits, MessageActivityType } = require('discord.js');
const { token } = require('../config.json');
const ollama_interact = require('./ollama_interact/ollama_interact.js')
let chatHistory = [{role: "system", content: system_prompt}]
let generation_inprogress = false
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

function process_command(command, message)
{
	if (command === "clear")
	{
		chatHistory = [{role: "system", content: system_prompt}]
		message.reply("Cleared history");
	}
	else if (command === "chat_size")
	{
		message.reply("History length: "+chatHistory.length);
	} else if (command === "help") {
		message.reply("1. clear\n2. chat_size");
	} 
	else 
	{
		message.reply("Unknown command");
		message.reply("1. clear\n2. chat_size");
	}
}

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
		//throw "Model not installed";
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
		if (message.content.startsWith("ROTBOT COMMAND: "))
		{
			let command = message.content.replace("ROTBOT COMMAND: ", "");
			process_command(command, message);
		}
		if(message.content.toLowerCase().startsWith(clientPingTag)) {
			if (generation_inprogress)
			{
				message.channel.send({ content: `${message.author} SHUT THE FUCK UP IM THINKING IN ${message.channel}` });
				return;
			}
			generation_inprogress = true;
			let textContent = message.content.replace(clientPingTag, "").trimStart();
			message.channel.sendTyping();
			let typingInterval = setInterval(() => {message.channel.sendTyping(); console.log("typing sent")}, 2000);

			chatHistory.push({role: "user", content: textContent});
			try {
				let generate_result = await ollama_interact.message_send(required_model, chatHistory);
				console.log("Gen complete, "+generate_result["response"].length);
				chatHistory.push({role: "assistant", content: generate_result["response"]});

				generate_result["response"] = generate_result["response"].replace(/<think>[\s\S]*?<\/think>/g, "");
				generate_result["response"] = generate_result["response"].split("\n");
				
				let i=0;
				let workingtext = "";
				while (i<generate_result["response"].length)
				{
					workingtext+=generate_result["response"][i]+"\n";
					if (workingtext.length>1500)
					{
						message.channel.send({ content: workingtext+' ' });		
						workingtext="";
					}
					i++;
				}

				if (workingtext.length>0)
				{
					console.log("final");
					message.channel.send({ content: workingtext });
				}
				

			} catch (error) {
				message.channel.send({ content: "failure "+error });
			}
			clearInterval(typingInterval);
			console.log("event done")
			generation_inprogress = false;
			
			if (chatHistory.length>=100)
			{
				chatHistory.splice(1, 2);
			}
		}
	});	
}

