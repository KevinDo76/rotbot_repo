const https = require('http');
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
        let data = {model: `${name}`, messages: chatHistory, keep_alive: "60m"};
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