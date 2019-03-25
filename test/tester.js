const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const WebpackDevServer = require('webpack-dev-server')
const chromeRunner = require('mocha-headless-chrome').runner

const webpackConfig = {
    mode: "development",
    stats: 'errors-only',
    devtool: "inline-source-map",
    entry: ["./test/init.js", "./test/fetch.spec.ts", "./test/inline-funcs.spec.ts", "./test/service.spec.ts", "./test/run.js"],
    output: {
        filename: "bundle.js"
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js"]
    },
    module: {
        rules: [{
            test: /\.tsx?$/,
            loader: "ts-loader"
        }]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: 'test/index.html'
        })
    ],
    node: {
        fs: "empty"
    }
}

const devServer = new WebpackDevServer(webpack(webpackConfig), {
    clientLogLevel: 'error',
    noInfo: true,
    quiet: true
})

devServer.listen(8080, '127.0.0.1', e => {

    // const chromeOptions = {
    //     file: 'http://localhost:8080',
    //     timeout: 120000,
    //     reporter: 'nyan',
    //     args: ['no-sandbox']
    // }

    // chromeRunner(chromeOptions)
    //     .then(r => {
    //         const s = r.result.stats
    //         const diff = s.passes - s.tests
    //         process.exit(diff)
    //     })

}).on('error', e => {
    console.error(e.message)
    process.exit(-1)
})
