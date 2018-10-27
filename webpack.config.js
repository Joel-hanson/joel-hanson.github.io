const path = require('path');

module.exports = {
    output: {
    filename: 'main.js',
    path: path.resolve(__dirname, '.')
    },
    mode: 'development',
    devServer: {
        host: '0.0.0.0',
        port: 8080,
        compress: true,
        open: true,
        watchOptions: {
            ignored: /node_modules/,
            poll: true,
        },
        publicPath: '/dist/',
        contentBase: path.resolve('src/assets'),
        watchContentBase: true,
        inline: true
    },
};