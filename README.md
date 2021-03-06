## Running the Fabric Browser

##### Note: The fabric browser should be run as a contained application of [Eluvio Core JS](https://github.com/eluv-io/elv-core-js)

#### Quick start:
- Clone ```elv-fabric-browser```, ```elv-core-js```, and ```elv-client-js``` projects from github
- In ```elv-client-js```, initialize a new content space using the initialization script:
  ```
  cd elv-client-js
  npm install
  node InitContentSpace.js <path-to-qfab-config> <path-to-content-fabric-dir> <private-key>
  ```
- Copy the generated TestConfiguration.json from ```elv-client-js``` to configuration.json in ```elv-core-js``` and ```elv-fabric-browser```

  ```
  cp TestConfiguration.json ../elv-core-js/configuration.json && cp TestConfiguration.json ../elv-fabric-browser/configuration.json
  ```

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
