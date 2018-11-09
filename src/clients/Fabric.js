import { FrameClient } from "elv-client-js/ElvFrameClient-min";
import ContentObject from "../models/ContentObject";

const client = new FrameClient({
  target: window.parent,
  timeout: 10
});

const Fabric = {
  /* Libraries */

  ListContentLibraries: () => {
    return client.ContentLibraries();
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

  ReplacePublicLibraryMetadata: async ({libraryId, metadata}) => {
    return await client.ReplacePublicLibraryMetadata({libraryId, metadata});
  },

  /* Objects */

  ListContentObjects: async ({libraryId}) => {
    const libraryUrl = await client.FabricUrl({libraryId});
    const contentObjectData = await client.ContentObjects({ libraryId });

    return {
      contents: contentObjectData.contents.map(data => {
        data.url = libraryUrl + "/q/" + data.id;
        return data;
      })
    };
  },

  GetContentObject: async ({libraryId, objectId}) => {
    const contentObjectData = await client.ContentObject({ libraryId, contentHash: objectId });
    contentObjectData.url = await Fabric.FabricUrl({libraryId, contentHash: objectId});

    return contentObjectData;
  },

  GetContentObjectMetadata: ({libraryId, contentHash}) => {
    return client.ContentObjectMetadata({ libraryId, contentHash });
  },

  GetContentObjectVersions: ({libraryId, objectId}) => {
    return client.ContentObjectVersions({libraryId, objectId});
  },

  GetFullContentObject: async ({libraryId, objectId}) => {
    let contentObjectData = await Fabric.GetContentObject({ libraryId, objectId });

    const contentHash = contentObjectData.hash;
    contentObjectData.meta = await Fabric.GetContentObjectMetadata({ libraryId, contentHash });
    contentObjectData.parts = (await Fabric.ListParts({ libraryId, contentHash })).parts;

    let versions = (await Fabric.GetContentObjectVersions({ libraryId, objectId: contentObjectData.id })).versions;
    for(const version of versions) {
      version.meta = await Fabric.GetContentObjectMetadata({ libraryId, contentHash: version.hash });
      version.parts = (await Fabric.ListParts({ libraryId, contentHash: version.hash })).parts;
      version.verification = await Fabric.VerifyContentObject({libraryId, partHash: version.hash});

      for(const part of version.parts) {
        part.proofs = await Fabric.Proofs({libraryId, contentHash: objectId, partHash: part.hash});
      }
    }

    contentObjectData.versions = versions;

    return new ContentObject({ libraryId, contentObjectData });
  },

  /* Object creation / modification */

  CreateContentObject: async ({
    libraryId,
    metadata = {}
  }) => {
    let requestParams = {
      type: "",
      meta: metadata
    };

    return client.CreateContentObject({
      libraryId: libraryId,
      libraryContractAddress: await Fabric.GetContentLibraryContractAddress({libraryId}),
      options: requestParams
    });
  },

  EditContentObject: ({
    libraryId,
    objectId
  }) => {
    return client.EditContentObject({
      libraryId,
      contentId: objectId,
      options: {}
    });
  },

  MergeMetadata: ({
    libraryId,
    writeToken,
    metadataSubtree,
    metadata
  }) => {
    client.MergeMetadata({
      libraryId,
      writeToken,
      metadataSubtree,
      metadata
    });
  },

  ReplaceMetadata: ({
    libraryId,
    writeToken,
    metadataSubtree,
    metadata
  }) => {
    client.ReplaceMetadata({
      libraryId,
      writeToken,
      metadataSubtree,
      metadata
    });
  },

  DeleteMetadata: async ({
    libraryId,
    writeToken,
    metadataSubtree
  }) => {
    client.DeleteMetadata({
      libraryId,
      writeToken,
      metadataSubtree
    });
  },

  FinalizeContentObject: ({
    libraryId,
    writeToken
  }) => {
    return client.FinalizeContentObject({
      libraryId: libraryId,
      writeToken: writeToken
    });
  },

  // Convenience function to create and finalize object immediately
  // -- takes same arguments as CreateContentObject
  CreateAndFinalizeContentObject: async ({
    libraryId,
    metadata={}
  }) => {
    let createResponse = await Fabric.CreateContentObject({
      libraryId,
      metadata
    });

    return (
      await Fabric.FinalizeContentObject({
        libraryId,
        writeToken: createResponse.write_token
      })
    );
  },

  /* Files */

  CreateFileUploadJob: ({libraryId, writeToken, fileInfo}) => {
    return client.CreateFileUploadJob({libraryId, writeToken, fileInfo});
  },

  UploadFileData: ({libraryId, writeToken, jobId, fileData}) => {
    return client.UploadFileData({libraryId, writeToken, jobId, fileData});
  },

  GetUploadJobStatus: ({libraryId, writeToken, jobId}) => {
    return client.UploadJobStatus({libraryId, writeToken, jobId});
  },

  FinalizeUploadJobs: ({libraryId, writeToken}) => {
    return client.FinalizeUploadJobs({libraryId, writeToken});
  },

  DownloadFiles: ({libraryId, writeToken, filePath}) => {
    return client.DownloadFiles({libraryId, writeToken, filePath});
  },

  /* Parts */

  ListParts: ({libraryId, contentHash}) => {
    return client.ContentParts({libraryId, contentHash});
  },

  DownloadPart: ({libraryId, contentHash, partHash, format}) => {
    return client.DownloadPart({ libraryId, contentHash, partHash, format});
  },

  UploadPart: ({libraryId, writeToken, data}) => {
    return client.UploadPart({libraryId, writeToken, data});
  },

  FabricUrl: ({libraryId, contentHash, partHash}) => {
    return client.FabricUrl({libraryId, contentHash, partHash});
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

  SetCustomContentContract: ({contentContractAddress, customContractAddress}) => {
    return client.SetCustomContentContract({
      contentContractAddress,
      customContractAddress
    });
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
    partHash
  }) => {
    return client.VerifyContentObject({libraryId, partHash});
  },

  Proofs: ({libraryId, contentHash, partHash}) => {
    return client.Proofs({libraryId, contentHash, partHash});
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
        contentHash: info.contracts
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
        contentHash: editResponse.write_token
      });

      delete metadata.contracts[name];

      await Fabric.ReplaceMetadata({
        libraryId: info.libraryId,
        writeToken: editResponse.write_token,
        metadata
      });

      // End temporary metadata deletion

      await Fabric.FinalizeContentObject({
        libraryId: info.libraryId,
        writeToken: editResponse.write_token
      });
    }
  }
};



export default Fabric;
