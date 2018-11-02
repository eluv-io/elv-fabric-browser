## Running the Fabric Browser

##### Note: The fabric browser should be run as a contained application of [ElvCore](https://github.com/qluvio/elv-core-js)

TL;DR:
- Run this on localhost:8080 using ```npm run serve```
- Run ElvCore on localhost:8082 using ```npm run serve```
- Open ElvCore in the browser at http//localhost:8082


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
