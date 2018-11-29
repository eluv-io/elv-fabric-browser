## Running the Fabric Browser

##### Note: The fabric browser should be run as a contained application of [Eluvio Web Core](https://github.com/eluv-io/elv-web-core)

Quick start:
- Clone ```elv-fabric-browser```, ```elv-core-js```, ```elv-client-js```
- In ```elv-client-js```, initialize a new content space:
```
node InitContentSpace.js <path-to-qfab-config> <path-to-content-fabric-dir>
```
- Copy generated TestConfiguration.json in ```elv-client-js``` to configuration.json in ```elv-core-js``` and ```elv-fabric-browser```
- Seed the library ```elv-fabric-browser``` uses to store contract information:
```
node Seed.js <private-key>
```
- npm install + npm run serve ```elv-core-js``` and ```elv-fabric-browser```
- Open [http://localhost:8082](http://localhost:8082)


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
