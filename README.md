## Running the Fabric Browser

##### Note: The fabric browser should be run as a contained application of [Eluvio Core JS](https://github.com/eluv-io/elv-core-js)

#### Quick start:
- Clone this repo along with ```elv-core-js```, and ```elv-client-js``` projects from github
- Now set up a ```configuration.js``` file in the root directory using ```configuration-example.js``` as a guide. This can be done with 
```
cp configuration-example.js configuration.js
```
- Open the newly created ```configuration.js``` file and comment out all the config-url’s except for the one you wish to use (main, demo or test). Note that the config-url in elv-fabric-browser must match the config-url being used in elv-core-js otherwise the fabric-browser will not function.

- Run ```npm install && npm run serve``` in ```elv-core-js``` and ```elv-fabric-browser``` in separate terminal tabs
- Open [http://localhost:8082](http://localhost:8082) in your browser


#### Running with NPM

```
  npm install
  npm run serve
```

Then open http://localhost:8080 in your browser

##### Configuration
Edit ```./configuration.json``` to point to your fabric and ethereum nodes


#### IMPORTANT: CORS Configuration

##### Fabric

Ensure your qfab daemon configuration has the following options set
in the "api#cors" section

```json
"allowed_origins": [
  "*"
],
"allowed_methods": [
  "GET",
  "PUT",
  "POST",
  "OPTIONS",
  "DELETE"
],
 "allowed_headers": [
  "*"
 ]
```

##### Ethereum

If you are running Geth, ensure you have the rpccorsdomain flag set:

```geth --rpccorsdomain "*" ...```

Ganache should allow CORS requests by default

