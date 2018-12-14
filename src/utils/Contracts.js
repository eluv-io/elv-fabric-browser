import BaseContentSpaceContract from "elv-client-js/src/contracts/BaseContentSpace";
import BaseContentContract from "elv-client-js/src/contracts/BaseContent";
import BaseContentTypeContract from "elv-client-js/src/contracts/BaseContentType";
import BaseLibraryContract from "elv-client-js/src/contracts/BaseLibrary";
import BaseAccessGroupContract from "elv-client-js/src/contracts/BaseAccessControlGroup";
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

export const DetermineContractInterface = ({libraryId, objectId, isAccessGroup, isCustomContract, contractAddressParam}) => {
  const isContentSpaceLibrary = libraryId === Fabric.contentSpaceLibraryId;
  const isContentLibraryObject = objectId && (Fabric.utils.EqualHash(libraryId, objectId));

  if(isAccessGroup) {
    // Access Group
    return {
      type: ContractTypes.accessGroup,
      description: "Base Access Group Contract",
      abi: BaseAccessGroupContract.abi,
      contractAddress: contractAddressParam
    };
  }

  if(isContentSpaceLibrary && isContentLibraryObject) {
    // Content Space
    return {
      type: ContractTypes.contentSpace,
      description: "Base Content Space Contract",
      abi: BaseContentSpaceContract.abi,
      contractAddress: Fabric.utils.HashToAddress({hash: libraryId})
    };
  }

  if(isContentLibraryObject) {
    // Library
    return {
      type: ContractTypes.library,
      description: "Base Content Library Contract",
      abi: BaseLibraryContract.abi,
      contractAddress: Fabric.utils.HashToAddress({hash: libraryId})
    };
  }

  if(isContentSpaceLibrary) {
    // Content Type
    return {
      type: ContractTypes.contentType,
      description: "Base Content Type Contract",
      abi: BaseContentTypeContract.abi,
      contractAddress: Fabric.utils.HashToAddress({hash: objectId})
    };
  }

  if(objectId) {
    if(isCustomContract) {
      // Custom content object contract
      return {
        type: ContractTypes.customObject,
        description: "Custom Content Object Contract",
        abi: undefined,
        contractAddress: undefined
      };
    } {
      // Content Object
      return {
        type: ContractTypes.object,
        description: "Base Content Object Contract",
        abi: BaseContentContract.abi,
        contractAddress: Fabric.utils.HashToAddress({hash: objectId})
      };
    }
  }

  // Unknown
  return {
    type: ContractTypes.unknown,
    description: undefined,
    abi: undefined,
    contractAddress: contractAddressParam
  };
};
