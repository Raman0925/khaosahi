import { configure } from '@testing-library/react-native';

// Screen tests can be slow on CI and cold caches; avoid flaky findBy* timeouts.
configure({ asyncUtilTimeout: 5000 });
