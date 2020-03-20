# SpectralMP
Spectral Marker Pointer calculation web-application.

The easiest way to get going is to use the online version https://ecosim.infotech.monash.edu/SpectralMP/
Once the page is loaded, everything is happening locally in your browser: no data is transmited to the server.

### Building and testing
* First compile the Spectral Analysis module from the `typescript` folder.
  The output will be in the `dist` folder
  ```
  npm install
  tsc
  ```

* Go in the `web` folder
  ```
  npm install
  webpack OR webpack -w OR webpack --mode production
  ```

* For a CLI tool, go in the `cli` folder
  ```
  npm install
  tsc
  ```
  Then test the result with
  ```
  node dist/cli/src/cli.js --multi ../examples/SpectralMP_Sample1_FreshLeaves.csv
  ```

## Development notes
* Developed with Node.js and npm.
* If TypeScript is not installed system wise, it can be installed with `npm install typescript --save-dev`
* When developing, add the `nodes_modules/.bin` path in your shell $PATH
  * zsh: `path+=$(realpath node_modules/.bin)`
