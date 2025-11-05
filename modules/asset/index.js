module.exports = {
  handlers(self) {
    return {
      '@apostrophecms/page:beforeSend': {
        webpack(req) {
          req.data.isDev = (process.env.NODE_ENV !== 'production');
        }
      }
    };
  },
  options: {
    // Add htmx to the build
    alias: 'asset'
  }
};
