import { FrameClient } from "elv-client-js/ElvFrameClient-min";
import { ElvClient } from "elv-client-js/src/ElvClient";
import ContentObject from "../models/ContentObject";
import URI from "urijs";
import Path from "path";

const Configuration = require("../../configuration.json");

let client;

if(window.self === window.top) {
  client = ElvClient.FromConfiguration({configuration: Configuration});

  let wallet = client.GenerateWallet();
  let signer = wallet.AddAccount({
    accountName: "Alice",
    //privateKey: "04832aec82a6572d9a5782c4af9d7d88b0eb89116349ee484e96b97daeab5ca6"
    privateKey: "1307df44f8f5033ec86434a7965234015da85261df149ed498cb29907df38d72"
  });
  client.SetSigner({signer});
} else {
  // Contained in IFrame
  client = new FrameClient({
    target: window.parent,
    timeout: 10
  });
}

const Fabric = {
  /* Utils */
  // TODO: Get the content space ID in the frameclient from parent
  contentSpaceId: Configuration.fabric.contentSpaceId,
  contentSpaceLibraryId: Configuration.fabric.contentSpaceId.replace("ispc", "ilib"),
  utils: client.utils,

  /* Libraries */

  ListContentLibraries: async () => {
    return await client.ContentLibraries();
  },

  GetContentLibrary: async ({libraryId}) => {
    const contentLibraryData = await client.ContentLibrary({libraryId});
    contentLibraryData.url = await Fabric.FabricUrl({libraryId});

    return contentLibraryData;
  },

  GetContentLibraryContractAddress: async ({libraryId}) => {
    const libraryInfo = await Fabric.GetContentLibrary({libraryId});
    return libraryInfo.meta["eluv.contract_address"];
  },

  CreateContentLibrary: async ({name, description, publicMetadata, privateMetadata}) => {
    return await client.CreateContentLibrary({name, description, publicMetadata, privateMetadata});
  },

  DeleteContentLibrary: async ({libraryId}) => {
    await client.DeleteContentLibrary({libraryId});
  },

  ReplacePublicLibraryMetadata: async ({libraryId, metadata}) => {
    return await client.ReplacePublicLibraryMetadata({libraryId, metadata});
  },

  /* Objects */

  ListContentObjects: async ({libraryId}) => {
    const libraryUrl = await client.FabricUrl({libraryId});
    const contentObjectData = await client.ContentObjects({ libraryId });

    return {
      contents: contentObjectData.contents.map(data => {
        const uri = new URI(libraryUrl);
        uri.path(Path.join(uri.path(), "q", data.id));
        data.url = uri.toString();
        return data;
      })
    };
  },

  GetContentObject: async ({libraryId, objectId}) => {
    const contentObjectData = await client.ContentObject({ libraryId, objectId });
    contentObjectData.url = await Fabric.FabricUrl({libraryId, objectId});

    return contentObjectData;
  },

  GetContentObjectMetadata: async ({libraryId, objectId, versionHash}) => {
    return await client.ContentObjectMetadata({ libraryId, objectId, versionHash });
  },

  GetContentObjectVersions: async ({libraryId, objectId}) => {
    return await client.ContentObjectVersions({libraryId, objectId});
  },

  GetFullContentObject: async ({libraryId, objectId}) => {
    let contentObjectData = await Fabric.GetContentObject({ libraryId, objectId });

    const versionHash = contentObjectData.hash;
    contentObjectData.meta = await Fabric.GetContentObjectMetadata({ libraryId, objectId, versionHash });
    contentObjectData.parts = (await Fabric.ListParts({ libraryId, objectId, versionHash })).parts;

    let versions = (await Fabric.GetContentObjectVersions({ libraryId, objectId })).versions;
    for(const version of versions) {
      version.meta = await Fabric.GetContentObjectMetadata({ libraryId, objectId, versionHash: version.hash });
      version.parts = (await Fabric.ListParts({ libraryId, objectId, versionHash: version.hash })).parts;
      version.verification = await Fabric.VerifyContentObject({libraryId, objectId, partHash: version.hash});

      for(const part of version.parts) {
        part.proofs = await Fabric.Proofs({libraryId, objectId, versionHash: version.hash, partHash: part.hash});
      }
    }

    contentObjectData.versions = versions;

    return new ContentObject({libraryId, contentObjectData});
  },

  /* Object creation / modification */

  CreateContentObject: async ({
    libraryId,
    type,
    metadata = {}
  }) => {
    let requestParams = {
      type,
      meta: metadata
    };

    return client.CreateContentObject({
      libraryId: libraryId,
      options: requestParams
    });
  },

  DeleteContentObject: async ({libraryId, objectId}) => {
    await client.DeleteContentObject({libraryId, objectId});
  },

  DeleteContentVersion: async ({libraryId, objectId, versionHash}) => {
    await client.DeleteContentVersion({libraryId, objectId, versionHash});
  },

  EditContentObject: async ({
    libraryId,
    objectId
  }) => {
    return await client.EditContentObject({
      libraryId,
      objectId,
      options: {}
    });
  },

  MergeMetadata: async ({
    libraryId,
    objectId,
    writeToken,
    metadataSubtree,
    metadata
  }) => {
    await client.MergeMetadata({
      libraryId,
      objectId,
      writeToken,
      metadataSubtree,
      metadata
    });
  },

  ReplaceMetadata: async ({
    libraryId,
    objectId,
    writeToken,
    metadataSubtree,
    metadata
  }) => {
    await client.ReplaceMetadata({
      libraryId,
      objectId,
      writeToken,
      metadataSubtree,
      metadata
    });
  },

  DeleteMetadata: async ({
    libraryId,
    objectId,
    writeToken,
    metadataSubtree
  }) => {
    await client.DeleteMetadata({
      libraryId,
      objectId,
      writeToken,
      metadataSubtree
    });
  },

  FinalizeContentObject: async ({
    libraryId,
    objectId,
    writeToken
  }) => {
    return await client.FinalizeContentObject({
      libraryId,
      objectId,
      writeToken
    });
  },

  // Convenience function to create and finalize object immediately
  // -- takes same arguments as CreateContentObject
  CreateAndFinalizeContentObject: async ({
    libraryId,
    type,
    metadata={}
  }) => {
    let createResponse = await Fabric.CreateContentObject({
      libraryId,
      type,
      metadata
    });

    return (
      await Fabric.FinalizeContentObject({
        libraryId,
        objectId: createResponse.id,
        writeToken: createResponse.write_token
      })
    );
  },

  /* Files */

  CreateFileUploadJob: ({libraryId, objectId, writeToken, fileInfo}) => {
    return client.CreateFileUploadJob({libraryId, objectId, writeToken, fileInfo});
  },

  UploadFileData: ({libraryId, objectId, writeToken, jobId, fileData}) => {
    return client.UploadFileData({libraryId, objectId, writeToken, jobId, fileData});
  },

  GetUploadJobStatus: ({libraryId, objectId, writeToken, jobId}) => {
    return client.UploadJobStatus({libraryId, objectId, writeToken, jobId});
  },

  FinalizeUploadJobs: ({libraryId, objectId, writeToken}) => {
    return client.FinalizeUploadJobs({libraryId, objectId, writeToken});
  },

  DownloadFiles: ({libraryId, objectId, writeToken, filePath}) => {
    return client.DownloadFiles({libraryId, objectId, writeToken, filePath});
  },

  /* Parts */

  ListParts: ({libraryId, objectId, versionHash}) => {
    return client.ContentParts({libraryId, objectId, versionHash});
  },

  DownloadPart: ({libraryId, objectId ,versionHash, partHash, format}) => {
    return client.DownloadPart({ libraryId, objectId, versionHash, partHash, format});
  },

  UploadPart: ({libraryId, objectId, writeToken, data}) => {
    return client.UploadPart({libraryId, objectId, writeToken, data});
  },

  FabricUrl: ({libraryId, objectId, versionHash, partHash}) => {
    return client.FabricUrl({libraryId, objectId, versionHash, partHash});
  },

  /* Contracts */
  FormatContractArguments: ({abi, methodName, args}) => {
    return client.FormatContractArguments({abi, methodName, args});
  },

  DeployContract: ({abi, bytecode, constructorArgs}) => {
    return client.DeployContract({abi, bytecode, constructorArgs});
  },

  CallContractMethod: ({contractAddress, abi, methodName, methodArgs}) => {
    return client.CallContractMethod({contractAddress, abi, methodName, methodArgs});
  },

  CallContractMethodAndWait: ({contractAddress, abi, methodName, methodArgs}) => {
    return client.CallContractMethodAndWait({contractAddress, abi, methodName, methodArgs});
  },

  SetCustomContentContract: ({objectId, customContractAddress, overrides={}}) => {
    return client.SetCustomContentContract({
      objectId,
      customContractAddress,
      overrides
    });
  },

  ContentObjectContractEvents: ({objectId}) => {
    return client.ContentObjectContractEvents({objectId});
  },

  ContractEvents: ({contractAddress, abi}) => {
    return client.ContractEvents({contractAddress, abi});
  },

  /* Naming */

  async GetByName({name}) {
    try {
      return await client.GetByName({name});
    } catch(error) {
      if(error.status === 404) {
        return undefined;
      }

      throw error;
    }
  },

  SetByName({name, target}) {
    return client.SetByName({name, target});
  },

  async GetObjectByName({name}) {
    try {
      let objectData = await client.GetObjectByName({name});

      return new ContentObject({contentObjectData: objectData});
    } catch(error) {
      if(error.status === 404) {
        return undefined;
      }

      throw error;
    }
  },

  SetObjectByName({name, libraryId, objectId}) {
    return client.SetObjectByName({name, libraryId, objectId});
  },

  DeleteName({name}) {
    return client.DeleteName({name});
  },

  VerifyContentObject: ({
    libraryId,
    objectId,
    partHash
  }) => {
    return client.VerifyContentObject({libraryId, objectId, partHash});
  },

  Proofs: ({libraryId, objectId, versionHash, partHash}) => {
    return client.Proofs({libraryId, objectId, versionHash, partHash});
  },

  FabricBrowser: {
    async Info() {
      try {
        const info = await client.GetByName({
          name: "elv-fabric-browser"
        });

        return JSON.parse(info.target);
      } catch(error) {
        if(error.status === 404) {
          throw new Error("Please run the seed script to initialize the fabric browser");
        } else {
          throw error;
        }
      }
    },

    async Contracts() {
      const info = await Fabric.FabricBrowser.Info();

      return (await Fabric.GetContentObjectMetadata({
        libraryId: info.libraryId,
        objectId: info.contracts
      })).contracts;
    },

    async AddContract({name, description, abi, bytecode}) {
      const info = await Fabric.FabricBrowser.Info();

      const editResponse = await Fabric.EditContentObject({
        libraryId: info.libraryId,
        objectId: info.contracts
      });

      await Fabric.MergeMetadata({
        libraryId: info.libraryId,
        objectId: info.contracts,
        writeToken: editResponse.write_token,
        metadataSubtree: "contracts",
        metadata: {
          [name]: {
            description,
            abi,
            bytecode
          }
        }
      });

      await Fabric.FinalizeContentObject({
        libraryId: info.libraryId,
        objectId: info.contracts,
        writeToken: editResponse.write_token
      });
    },

    async RemoveContract({name}) {
      const info = await Fabric.FabricBrowser.Info();

      const editResponse = await Fabric.EditContentObject({
        libraryId: info.libraryId,
        objectId: info.contracts
      });

      // TODO: Delete metadata currently doesn't work

      /*
      await Fabric.DeleteMetadata({
        libraryId: info.libraryId,
        writeToken: editResponse.write_token,
        metadataSubtree: Path.join("contracts", name),
      });
      */

      // Temporary metadata deletion

      const metadata = await Fabric.GetContentObjectMetadata({
        libraryId: info.libraryId,
        objectId: info.contracts
      });

      delete metadata.contracts[name];

      await Fabric.ReplaceMetadata({
        libraryId: info.libraryId,
        objectId: info.contracts,
        writeToken: editResponse.write_token,
        metadata
      });

      // End temporary metadata deletion

      await Fabric.FinalizeContentObject({
        libraryId: info.libraryId,
        objectId: info.contracts,
        writeToken: editResponse.write_token
      });
    }
  }
};



export default Fabric;
