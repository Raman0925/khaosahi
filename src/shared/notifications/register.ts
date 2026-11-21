/**
 * Side-effect module imported once from index.js: notify-kit needs its background event handler
 * registered at module scope, before the app component mounts.
 */
import { registerNotificationHandlers } from './taps';

registerNotificationHandlers();
