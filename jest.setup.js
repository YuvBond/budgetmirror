import 'react-native-gesture-handler/jestSetup';

// Reanimated mock recommended by the library
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// Some versions of Reanimated expect this to exist
global.__reanimatedWorkletInit = () => {};

// Prevent async font-loading/setState inside @expo/vector-icons during tests
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Icon = (props) => React.createElement(View, props);

  return new Proxy(
    {},
    {
      get: () => Icon,
    }
  );
});

// React 19 + @expo/vector-icons may log an "act(...)" warning due to async font-loading.
// It's harmless for our unit/component tests; keep CI output clean.
const originalConsoleError = console.error;
// eslint-disable-next-line no-console
console.error = (...args) => {
  const first = args[0];
  if (typeof first === 'string' && first.includes('not wrapped in act')) return;
  originalConsoleError(...args);
};

