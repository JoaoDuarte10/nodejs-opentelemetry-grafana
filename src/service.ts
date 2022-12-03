import axios from 'axios';
import { logger } from './logger/logging';
import { sleep } from './utils/sleep';

export async function fetchRandomMessage(traceId: string): Promise<response> {
    const maxAttempts = 3;
    let count = 1;
    let retry = true;

    while (retry) {
        try {
            const uri = 'https://api.adviceslip.com/advice/88asd5a5sd5asdasd595';
            const { data } = await axios.get(uri, {
                timeout: 5000
            });
            return data;
        } catch (error) {
            logger.error('[fetchRandomMessage] Failed in request to get messages', { traceId, error: error.message, count });
            if (count <= maxAttempts) {
                count++
                await sleep(2000);
                continue;
            }
            retry = false
        }
    }
    throw new Error('[fetchRandomMessage] Fail to fetch messages');
}

type response = {
    slip: {
        id: number,
        advice: string,
    }
}