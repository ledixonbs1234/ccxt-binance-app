import { restoreTrailingStopsFromDB } from './trailingStopState';

// Khôi phục trạng thái khi khởi động server
export const initializeServer = async () => {
    console.log('Initializing server...');
    await restoreTrailingStopsFromDB();
    console.log('Server initialization complete');
};