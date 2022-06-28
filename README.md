## Running the Fabric Browser

##### Note: The fabric browser should be run as a contained application of [Eluvio Core JS](https://github.com/eluv-io/elv-core-js)

#### Quick start:
- Clone this repo along with the ```elv-core-js``` project from github
- Now set up a ```configuration.js``` file in the root directory using ```configuration-example.js``` as a guide. This can be done with 
```
cp configuration-example.js configuration.js
```
- Open the newly created ```configuration.js``` file and comment out all instances of ```config-url``` except for the one you wish to use (main, demo or test). Note that the config-url in elv-fabric-browser must match the config-url being used in elv-core-js otherwise the fabric-browser will not function.
- Ensure that ```coreUrl``` points to "http://localhost:8082" as this is the (local ```elv-core-js``` url)
- Run ```npm install && npm run serve``` in ```elv-core-js``` and ```elv-fabric-browser``` in separate terminal tabs
- Open [http://localhost:8082](http://localhost:8082) in your browser

### Other Configuration Options:
The following configuration options can also be set in ```configuration.js``` and default options are provided in ```configuration-example.js```
- ```displayUrl``` indicates the app to be used to display content objects. (e.g elv-stream-sample is the default display appfor playable objects)
- ```manageAppUrl``` indicates the app to be used for content object data and metadata management (defaults to asset-manager for most types)
-  ```fabricBrowserApps``` provides a list of available apps which can be used for either content data management (```manageAppUrl```) or content display (```displayAppUrl```)
