// metro.config.js
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);
const { assetExts, sourceExts } = defaultConfig.resolver;

/**
 * Metro configuration
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  transformer: {
    // دقت کن: خودِ پکیج رو می‌دیم، نه `/react-native`
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resolver: {
    // svg رو از asset‌ها حذف می‌کنیم که به عنوان سورس (کامپوننت) شناخته بشه
    assetExts: assetExts.filter(ext => ext !== 'svg'),
    // svg رو به لیست سورس‌ها اضافه می‌کنیم
    sourceExts: [...sourceExts, 'svg'],
  },
};

module.exports = mergeConfig(defaultConfig, config);