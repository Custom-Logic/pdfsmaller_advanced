// jest.config.js
export default {
  testEnvironment: 'jsdom',
  extensionsToTreatAsEsm: ['.js', '.jsx'],
  moduleNameMapping: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transform: {
    '^.+\\.jsx?$': 'babel-jest'
  }
};