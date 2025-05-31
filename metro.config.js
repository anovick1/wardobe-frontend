// metro.config.js
const { getDefaultConfig } = require("@expo/metro-config");

const config = getDefaultConfig(__dirname);

// 👇  Firebase’s JS SDK still ships .cjs files – tell Metro to load them
config.resolver.sourceExts.push("cjs");

// 👇  Turn OFF Metro’s new “package exports” resolver (breaks Firebase Auth)
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
