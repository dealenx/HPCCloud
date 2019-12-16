module.exports = [
  {
    test: /\.js$/,
    include: /node_modules(\/|\\)simput-kemsu(\/|\\)/,
    use: [
      {
        loader: 'babel-loader',
        options: {
          presets: ['env', 'react'],
        },
      },
    ],
  },
];
