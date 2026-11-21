import packageJson from '../../../package.json';

/** App version (single source: package.json; Gradle reads the same value for versionName). */
export const APP_VERSION: string = packageJson.version;
