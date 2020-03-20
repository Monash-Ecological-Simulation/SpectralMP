// Config based on official doc
// March 2018
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

function absolutePath(p) {
  return path.resolve(__dirname, path.join(...p.split("/")));
}

const config = {
  // Entry point of the application
  entry: absolutePath("src/main.tsx"),

  // Output: filename
  output: {
    filename: "main.[chunkhash].js",
    path: absolutePath("website")
  },

  // Loaders: allow to treat non-js file as "module"
  module: {
    rules: [
      // --- --- --- For example, a rule for raw text
      // { test: /\.txt$/, use: 'raw-loader' }

      // --- --- --- And our rule for TypeScript
      {
        test: /\.tsx?$/, // File testing: .ts and .tsx (react in typescript)
        use: "ts-loader", // Use ts-loader
        exclude: /node_modules/ // Exclude this folder
      },


      {
        test: /\.(png|svg|jpg|gif)$/,
        use: [
          'file-loader'
        ]
      },

      // --- --- --- All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
      // { enforce: "pre", test: /\.js$/, loader: "source-map-loader" },

      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"]
      }
    ]
  },

  // Resolve:
  // options for resolving module requests (does not apply to resolving to loaders)
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    alias: {
      "@web": absolutePath("src"),
      "@lib": absolutePath("../typescript/src")
    }
  },

  // Mode
  // mode: 'production'
  mode: "development",

  plugins: [
    new HtmlWebpackPlugin({
      template: absolutePath("src/index.html")
    })
  ]
};

module.exports = config;
