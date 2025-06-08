export const getAuth = jest.fn(() => ({
  currentUser: { uid: "test-user" },
}));

export const signOut = jest.fn(() => Promise.resolve());

export const getReactNativePersistence = jest.fn(); // 👈 add this
