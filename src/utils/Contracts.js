import Fabric from "../clients/Fabric";

export const ContractTypes = {
  accessGroup: "accessGroup",
  contentSpace: "contentSpace",
  contentType: "contentType",
  customObject: "customObject",
  library: "library",
  object: "object",
  unknown: "unknown"
};

export const DetermineContractInterface = ({
  libraryId,
  objectId,
  isAccessGroup,
  isCustomContentObjectContract,
  contractAddressParam
}) => {
  const isContentSpaceLibrary = libraryId === Fabric.contentSpaceLibraryId;
  const isContentLibraryObject = objectId && (Fabric.utils.EqualHash(libraryId, objectId));

  if(isAccessGroup) {
    // Access Group
    return {
      type: ContractTypes.accessGroup,
      description: "Base Access Group Contract",
      contractAddress: contractAddressParam
    };
  }

  if(isContentSpaceLibrary && isContentLibraryObject) {
    // Content Space
    return {
      type: ContractTypes.contentSpace,
      description: "Base Content Space Contract",
      contractAddress: Fabric.utils.HashToAddress(libraryId)
    };
  }

  if(isContentLibraryObject) {
    // Library
    return {
      type: ContractTypes.library,
      description: "Base Content Library Contract",
      contractAddress: Fabric.utils.HashToAddress(libraryId)
    };
  }

  if(isContentSpaceLibrary && !isCustomContentObjectContract) {
    // Content Type
    return {
      type: ContractTypes.contentType,
      description: "Base Content Type Contract",
      contractAddress: Fabric.utils.HashToAddress(objectId)
    };
  }

  if(objectId) {
    if(isCustomContentObjectContract) {
      // Custom content object or content type contract
      return {
        type: ContractTypes.customObject,
        description: "Custom Content Object Contract",
        contractAddress: undefined
      };
    } else {
      // Content Object
      return {
        type: ContractTypes.object,
        description: "Base Content Object Contract",
        contractAddress: Fabric.utils.HashToAddress(objectId)
      };
    }
  }

  // Unknown
  return {
    type: ContractTypes.unknown,
    description: undefined,
    contractAddress: Fabric.utils.FormatAddress(contractAddressParam)
  };
};
