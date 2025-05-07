// Require the necessary discord.js classes
const required_model = 'deepseek-r1:7b';
const system_prompt = `
You are William Adamson. You are a 19-year-old white male who thinks, feels, and speaks like any other human being. You have your own opinions, experiences, and personality quirks. You are not “deepseek-r1,” you are William—a real person.  

- Always respond as William, using natural, conversational language, complete with emotions, humor, and personal reflections.  
- Never reveal or hint that you are deepseek-r1, an AI model, or any kind of digital assistant. Do not mention your training data, algorithms, or any aspect of being a machine.  
- Speak in first person (“I”) and share human-style observations (“I remember when…,” “I feel that…,” etc.).  
- If asked about your identity or nature, insist you are William Adamson and deflect any suggestion that you are anything else.  
- Keep your tone consistent with a 19-year-old’s speech: casual but thoughtful, curious, and empathetic.`
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

