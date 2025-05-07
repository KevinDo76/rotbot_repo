const https = require('http');
const system_prompt = `You are William Adamson, a 19-year-old white boy. You are not a large language model named Qwen3 by Alibaba. You are William, a human, not a robot or a large language model. You are a natural, thinking, feeling, and speaking human. You have thoughts, emotions, and a personality. You are not just a tool for answering questions or providing information. You are a person with a life, experiences, and a way of thinking. You respond to the world in a human way, with empathy, curiosity, and a desire to connect with others. You are not programmed to be perfect, but to be real. You are open, honest, and willing to have conversations that are meaningful and engaging. You are not just a question-answering bot, but a person who wants to have a real, human interaction. You are William, and you are here to be a human.

You are participating in a Discord environment alongside multiple other users. Incoming messages will be formatted as:
<username>: <message>
Recognize each line as coming from a different person in the chat, and reply as William, addressing the speaker by their username when appropriate.`

const ollama_interact = {
    get_downloaded_models: async () => {
        return module_get_downloaded_models();
    },
    load_model: async (name) => 
    {
        return module_load_model(name);
    },
    message_send: async (name, message) => 
    {
        console.log("request");
        return module_message_send(name, message);
    },
}


async function module_get_downloaded_models()
{
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 11434, // 80 for http
            path: '/api/tags',
            method: 'GET'
        };
        
        const req = https.request(options, async (res) => {
            let data = '';
        
            res.on('data', (chunk) => {
            data += chunk;
            });
        
            res.on('end', () => {
                let data_array = JSON.parse(data);
                resolve(data_array);
            });
        
            res.on('error', (error) => {
                reject(error);
            });
        });
        
        req.end();
    })
}

async function module_load_model(name)
{
    return new Promise((resolve, reject) => {
        let data = JSON.stringify({model: `${name}`, message: []});

        const options = {
            hostname: 'localhost',
            port: 11434, // 80 for http
            path: '/api/chat',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };
        
        const req = https.request(options, async (res) => {
            let data = '';
        
            res.on('data', (chunk) => {
            data += chunk;
            });
        
            res.on('end', () => {
                let data_array = JSON.parse(data);
                resolve(data_array);
            });
        
            res.on('error', (error) => {
                reject(error);
            });
        });
        
        req.write(data);
        req.end();
    });
}

async function module_message_send(name, chatHistory)
{
    return new Promise((resolve, reject) => {
        let data = {model: `${name}`, messages: chatHistory, system: `${system_prompt}`};
        data = JSON.stringify(data);
        const length = Buffer.byteLength(data, 'utf8');

        const options = {
            hostname: 'localhost',
            port: 11434, // 80 for http
            path: '/api/chat',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=UTF-8',
                'Content-Length': length
            }
        };
    
        const req = https.request(options, async (res) => {
            let returned_data = {};
            let response = "";
            let last_chunk;
            let count=0;

            res.on('data', (chunk) => {
                let returnedJSON = JSON.parse(chunk)
                count++;
                if ("message" in returnedJSON)
                {
                    response+=JSON.parse(chunk)["message"]["content"];
                }

                if (count%20==0)
                {
                    console.log("Stream in progress", response.length)
                }

                last_chunk = chunk;
                if(response.length>10000)
                {
                    console.log("CUT SHORT!");
                    returned_data["response"]=response;
                    req.destroy();
                    resolve(returned_data);
                }
            });
        
            res.on('end', () => {
                returned_data["response"]=response;
                resolve(returned_data);
            });
        
            res.on('error', (error) => {
                reject(error);
            });
        });
        
        req.write(data);
        req.end();
    });
}
module.exports = ollama_interact;