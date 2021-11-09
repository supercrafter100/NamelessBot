import { client, config } from '../index';
import Tesseract from 'tesseract.js';
import EmbedUtils from '../constants/EmbedUtil';
import fetch from 'node-fetch';

client.on('messageCreate', async (msg) => {
    if (!msg.guild) return;
    if (msg.guild.id !== config.guildID) return;
    if (config.channelExclusions.autoresponses.includes(msg.channel.id)) return;

    // Global text that ocr gets run on
    let text = "";

    
    // Check for attachments
    for (const attachment of msg.attachments.toJSON()) {
        
        if (!attachment.contentType?.includes('image')) {
            continue;
        }
        
        // Detect text on the image
        text += " ";
        text += await Tesseract.recognize(
            attachment.url,
            'eng'
        ).then((res) => res.data.text);   
    }
        
    // Check for any urls
    const urlRegex =/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    const urls = msg.content.match(urlRegex) ?? [];
    
    for (const url of urls) {
        if (!isValidImageURL(url)) {
            continue;
        }
        text += " ";
        text += await Tesseract.recognize(
            url,
            'eng'
        ).then((res) => res.data.text);
    }
        
    // Finally, add the message content itself
    text += " ";
    text += msg.content;
    
    // Now check if any responses match
    // Get all available responses
    const responses = require(`../../data/${config.repositoryName}/autoresponse.js`);
    const matchedResponse = await matchResponse(responses, text);
    if (!matchedResponse) {
        return;
    }
    EmbedUtils.sendResponse(msg, EmbedUtils.embedColor.OK, matchedResponse.title, matchedResponse.footer, matchedResponse.body.join('\n'));
})
    
async function matchResponse(responses: any, text: string) {
    
    // Replace some characters that are likely falsely detected & will cause issues wth the key matching system
    text = text.replace(/\n/g, ' ');
    text = text.replace(/\`/g, '\'');
    text = text.replace(/\‘/g, '\'');

    const regex = /https:\/\/debug\.namelessmc\.com\/([^\s]*)/gm;
    const matches = regex.exec(text);
    const debugID = matches ? matches[1] : undefined;
    
    
    const matchedResponses = [];

    for (const response of responses) {
        
        // Check if a valid debug url is required
        const requiredDebugURL = response.requiresDebugLink;
        if (!debugID && requiredDebugURL) {
            continue;
        }
        const debugContents = debugID ? await getDebugContents(debugID!) : undefined;

        const success = requiredDebugURL ? response.check(text, debugContents) : response.check(text);

        if (success) {
            matchedResponses.push(response);
        }
    }

    if (matchedResponses.length === 0) {
        return;
    }

    // Return response with the highest priority
    return matchedResponses.reduce((curr, prev) => {
        return (curr.priority > prev.priority) ? curr : prev;
    }).response;
}

function isValidImageURL(text: string) {
    
    const cleanedURL = text.split('?')[0] // Removes any parameters because nobody likes those
    for (const ext of config.imageExtensions) {
        if (cleanedURL.endsWith(ext)) {
            return true;
        }
    }
    return false;
}

async function getDebugContents(debugID: string) {
    
    // Check if the regular paste has it
    let paste = await fetch(`https://paste.rkslot.nl/raw/${encodeURIComponent(debugID)}`).then((res) => res.json()).catch(() => undefined);
    if (paste) {
        return paste;
    }

    paste = await fetch(`https://bytebin.rkslot.nl/${encodeURIComponent(debugID)}`).then((res) => res.json()).catch(() => undefined);
    if (paste) {
        return paste;
    }

    return undefined;
}
