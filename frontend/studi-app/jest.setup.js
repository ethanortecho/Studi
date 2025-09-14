// Mock AsyncStorage
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Set up global test environment
global.beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();

  // Reset AsyncStorage
  mockAsyncStorage.clear();
});