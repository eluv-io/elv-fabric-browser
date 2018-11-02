import { FrameClient } from "elv-client-js/ElvFrameClient-min";
import ContentObject from "../models/ContentObject";

const client = new FrameClient({
  target: window.parent,
  timeout: 10
});

let Fabric = {
  /* Libraries */

  ListContentLibraries: () => {
    return client.ContentLibraries();
  },

  GetContentLibrary: ({libraryId}) => {
    return client.ContentLibrary({libraryId});
  },

  CreateContentLibrary: async ({libraryName, libraryDescription}) => {
    return await client.CreateContentLibrary({libraryName, libraryDescription});
  },

  /* Objects */

  ListContentObjects: ({libraryId}) => {
    return client.ContentObjects({ libraryId });
  },

  GetContentObject: ({libraryId, objectId}) => {
    return client.ContentObject({ libraryId, contentHash: objectId });
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

  CreateContentObject: ({
    libraryId,
    name,
    type,
    metadata = {}
  }) => {
    let requestParams = {
      type: "", // TODO: Why doesn't it accept a type?
      meta: {
        "eluv.name": name,
        "eluv.type": type,
        ...metadata
      }
    };

    return client.CreateContentObject({
      libraryId: libraryId,
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
    name,
    type,
    metadata
  }) => {
    let createResponse = await Fabric.CreateContentObject({
      libraryId,
      name,
      type,
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

  PartUrl: ({libraryId, contentHash, partHash}) => {
    return client.PartUrl({libraryId, contentHash, partHash});
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
  }
};

export default Fabric;
