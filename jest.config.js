const expoPreset = require('jest-expo/jest-preset');

// jest-expo's babel transform only matches .js/.jsx/.ts/.tsx; @firebase/util
// ships untransformed .mjs files, so widen the pattern to include them.
const babelTransform = expoPreset.transform['\\.[jt]sx?$'];
const transform = { ...expoPreset.transform };
delete transform['\\.[jt]sx?$'];
transform['\\.m?[jt]sx?$'] = babelTransform;

module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transform,
  transformIgnorePatterns: [
    'node_modules/(?!(expo.*|@expo.*|react-native.*|@react-native.*|@react-navigation.*|firebase|@firebase)/)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],
  moduleFileExtensions: ['js', 'jsx', 'mjs', 'json', 'ts', 'tsx'],
};
