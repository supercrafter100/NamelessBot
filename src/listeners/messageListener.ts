import SingleValueCache from '../cache/SingleValueCache';
import { client, config } from '../index';
import { OCRConfig } from '../constants/types';
import Tesseract from 'tesseract.js';
import EmbedUtils from '../constants/EmbedUtil';
import getFileFromRepository from '../util/getFileFromRepository';


client.on('messageCreate', async (msg) => {
    if (!msg.guild) return;
    if (msg.guild.id !== config.guildID) return;
    if (config.channelExclusions.autoresponses.includes(msg.channel.id)) return;

    // Global text that ocr gets run on
    let text = "";

    // Get all available responses
    const responses = JSON.parse(getFileFromRepository('/autoresponse.json')) as OCRConfig[];

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
    const matchedResponse = matchResponse(responses, text);
    if (!matchedResponse) {
        return;
    }
    EmbedUtils.sendResponse(msg, EmbedUtils.embedColor.OK, matchedResponse.response.title, matchedResponse.response.footer, matchedResponse.response.body.join('\n'));
})

function matchResponse(responses: OCRConfig[], text: string) {

    // Replace some characters that are likely falsely detected & will cause issues wth the key matching system
    text = text.replace(/\n/g, ' ');
    text = text.replace(/\`/g, '\'');
    text = text.replace(/\‘/g, '\'');
    text = text.toLowerCase();
    
    for (const response of responses) {
        if (!matchKeywords(response.keywords, text)) {
            continue;
        }

        return response;
    }
}

function matchKeywords(keywords: string[], text: string) {
    for (const keyword of keywords) {
        if (!text.toLowerCase().includes(keyword.toLowerCase())) {
            return false;
        }
    }
    return true;
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