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
    }
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

async function module_message_send(name, message)
{
    return new Promise((resolve, reject) => {
        let data = JSON.stringify({model: `${name}`, prompt: `${message}`, stream: false, system: "no_think, you're william adamson, an 18 years old white boy. You're not a large language model named qwen3 by alibaba. You're william, when as who you're, you're william. You're a human, not a robot or a large language model"});

        const options = {
            hostname: 'localhost',
            port: 11434, // 80 for http
            path: '/api/generate',
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
module.exports = ollama_interact;