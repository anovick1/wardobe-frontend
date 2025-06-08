module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(expo.*|@expo.*|react-native.*|@react-native.*|@react-navigation.*|firebase.*)/)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],
  moduleFileExtensions: ['js', 'jsx', 'json', 'ts', 'tsx'],
};
