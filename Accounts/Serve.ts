import App from 'CommonServer/Utils/StartServer';

import Express, { ExpressApplication } from 'CommonServer/Utils/Express';
import logger from 'CommonServer/Utils/Logger';

export const APP_NAME: string = 'accounts';

const app: ExpressApplication = Express.getExpressApp();

const init: Function = async (): Promise<void> => {
    try {
        // init the app
        await App(APP_NAME, undefined, true);
    } catch (err) {
        logger.error('App Init Failed:');
        logger.error(err);
    }
};

init();

export default app;
