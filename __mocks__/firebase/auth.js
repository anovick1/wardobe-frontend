const mockAuthInstance = {
  currentUser: {
    uid: "test-user",
    getIdToken: jest.fn(() => Promise.resolve("test-token")),
  },
};

export const getAuth = jest.fn(() => mockAuthInstance);

export const initializeAuth = jest.fn(() => mockAuthInstance);

export const getReactNativePersistence = jest.fn();

export const onAuthStateChanged = jest.fn(() => jest.fn());

export const signOut = jest.fn(() => Promise.resolve());

export const signInWithCredential = jest.fn(() => Promise.resolve());

export const getIdToken = jest.fn(() => Promise.resolve("test-token"));

export const FacebookAuthProvider = { credential: jest.fn() };

export const GoogleAuthProvider = { credential: jest.fn() };
