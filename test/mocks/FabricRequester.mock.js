import Fabric from "../../src/clients/FabricRequester";
import { ElvClient } from "elv-client-js";
import AppConfiguration from "../../configuration";

let FabricMock = {
  Wallet: () => {
    const client = new ElvClient({
      hostname: AppConfiguration.fabric.hostname,
      port: AppConfiguration.fabric.port,
      useHTTPS: AppConfiguration.fabric.use_https,
      ethHostname: AppConfiguration.ethereum.hostname,
      ethPort: AppConfiguration.ethereum.port,
      ethUseHTTPS: AppConfiguration.ethereum.use_https
    });

    return client.GenerateWallet();
  },

  ListContentLibraries: () => {
    return [ "ilibPACFbXkPSawEKi7KnfwCfb" ];
  },

  ListContentObjects: () => {
    return (
      {
        "contents": [
          {
            "id": "iq__6D1qLem852ggNcEYcAyvgT",
            "versions": [
              {
                "id": "iq__6D1qLem852ggNcEYcAyvgT",
                "hash": "hq__QmZPdxKM4wyvHG4En3LoAtZ9cQE9KL2MVNsEN17etCN2cA",
                "type": "hq__QmRDQwpgAMkc3TDsnvwmv2VSgg3zqNNFcMWKSdxxMX4QxU",
                "meta": {
                  "genre": "Animation",
                  "title": "Finding Dory",
                  "year": 2016
                }
              }
            ]
          },
          {
            "id": "iq__L9LkebHK3QQ7q3rWxmWs55",
            "versions": [
              {
                "id": "iq__L9LkebHK3QQ7q3rWxmWs55",
                "hash": "hq__QmRDQwpgAMkc3TDsnvwmv2VSgg3zqNNFcMWKSdxxMX4QxU",
                "type": "",
                "meta": {
                  "bitcode": "video.bc"
                }
              }
            ]
          }
        ]
      }
    );
  },

  GetContentObject: () => {
    return (
      {
        "id": "iq__8WCuZpLE6JjMKbLGa5KZaj",
        "hash": "hq__QmZPdxKM4wyvHG4En3LoAtZ9cQE9KL2MVNsEN17etCN2cA",
        "type": "hq__QmNyWraTrgY7rSdoRaejhedd7DBazwTAPGpSVYiZZQfAHw"
      }
    );
  },

  GetContentObjectMetadata: () => {
    return (
      {
        "id": "iq__6D1qLem852ggNcEYcAyvgT",
        "hash": "hq__QmZPdxKM4wyvHG4En3LoAtZ9cQE9KL2MVNsEN17etCN2cA",
        "type": "hq__QmRDQwpgAMkc3TDsnvwmv2VSgg3zqNNFcMWKSdxxMX4QxU",
        "meta": {
          "genre": "Animation",
          "title": "Finding Dory",
          "year": 2016
        }
      }
    );
  },

  DownloadPart: () => {

  },

  PartUrl: () => {

  },

  CreateContentLibrary: () => {
    return "ilibPACFbXkPSawEKi7KnfwCfb";
  },

  CreateContentObject: () => {
    return (
      {
        "id": "iq__EigNHQ5cFjBFjTtrG39Yco",
        "type": "hq__QmRDQwpgAMkc3TDsnvwmv2VSgg3zqNNFcMWKSdxxMX4QxU",
        "write_token": "tqw_GAQdkSsjXirpDpWsADWQTxbZMsVxwcPK9"
      }
    );
  },

  FinalizeContentObject: () => {
    return (
      {
        "id": "iq__6D1qLem852ggNcEYcAyvgT",
        "write_token": "tqw_EGheZaihN4Z1DX3VE6EVGLHiSWZSM6j4n",
        "type": "hq__QmRDQwpgAMkc3TDsnvwmv2VSgg3zqNNFcMWKSdxxMX4QxU"
      }
    );
  },

  // Convenience function to create and finalize object immediately
  // -- takes same arguments as CreateContentObject
  CreateAndFinalizeContentObject: async () => {
    Fabric.FinalizeContentObject();
  },

  // Multi-step setup methods

  spy: {
    clearSpyFunctions: () => {
      // Override Fabric methods with mock versions
      Object.keys(FabricMock).forEach((functionName) => {
        if(functionName === "spy") { return; }

        FabricMock.spy[functionName].mockClear();
      });
    }
  }
};

Object.keys(FabricMock).forEach((functionName) => {
  if(functionName === "spy") { return; }

  FabricMock.spy[functionName] = jest.spyOn(Fabric, functionName).mockImplementation(() => FabricMock[functionName]());
});

export default FabricMock;
