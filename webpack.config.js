// This is a custom webpack config that will be merged with the Create React App config

module.exports = {
  resolve: {
    alias: {
      'pdfjs-dist': require.resolve('pdfjs-dist/build/pdf')
    },
    fallback: {
      fs: false,
      stream: require.resolve('stream-browserify'),
      path: require.resolve('path-browserify')
    }
  }
};
