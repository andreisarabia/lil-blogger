export default {
  IS_DEV: process.env.NODE_ENV !== 'production',
  SHOULD_COMPILE: !process.argv.includes('no-compile'),
};
