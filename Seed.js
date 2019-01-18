// Create initial library + content objects needed to store fabric browser info

const { ElvClient } = require("elv-client-js/src/ElvClient");
const BaseContentContract = require("elv-client-js/src/contracts/BaseContent.js");

const client = ElvClient.FromConfiguration({configuration: require("./configuration")});

const GetByName = async (name) => {
  try {
    return await client.GetByName({name});
  } catch(error) {
    if(error.status !== 404) {
      console.error(error);
    }
  }
};

const SeedLibrary = async (fabricBrowserInfo) => {
  // Get/create library
  try {
    if(fabricBrowserInfo) {
      const libraryResponse = await client.ContentLibrary({libraryId: fabricBrowserInfo.libraryId});
      return {
        libraryId: fabricBrowserInfo.libraryId,
        contractAddress: libraryResponse.meta["eluv.contract_address"]
      };
    } else {
      const libraryId = await client.CreateContentLibrary({
        name: "Eluvio Content Fabric Browser",
        description: "Information used by Eluvio Content Fabric Browser"
      });

      return libraryId;
    }
  } catch(error) {
    console.error(error);
    console.error(error.stack);
  }
};

const SeedObject = async ({label, name, fabricBrowserInfo, libraryId}) => {
  try {
    // Get/create library
    if (fabricBrowserInfo && fabricBrowserInfo[name]) {
      return fabricBrowserInfo[name];
    } else {
      const createResponse = await client.CreateContentObject({
        libraryId,
        options: {
          meta: {
            "eluv.name": label,
            contracts: {},
            deployedContracts: {}
          }
        }
      });

      const finalizeResponse = await client.FinalizeContentObject({
        libraryId,
        objectId: createResponse.id,
        writeToken: createResponse.write_token
      });

      await client.CallContractMethodAndWait({
        contractAddress: client.utils.HashToAddress({hash: finalizeResponse.id}),
        abi: BaseContentContract.abi,
        methodName: "publish",
        methodArgs: []
      });

      return finalizeResponse.id;
    }
  } catch(error) {
    console.error(error);
    console.error(error.stack);
  }
};

const Seed = async () => {
  try {
    // Get / Create seeded info
    let fabricBrowserInfo = await GetByName("elv-fabric-browser");
    if(fabricBrowserInfo) { fabricBrowserInfo = JSON.parse(fabricBrowserInfo.target); }

    console.log("Creating library...");
    const libraryId = await SeedLibrary(fabricBrowserInfo);

    console.log("Creating access group container...");
    const accessGroupsObjectId = await SeedObject({
      label: "Access Groups",
      name: "accessGroups",
      fabricBrowserInfo,
      libraryId
    });

    console.log("Creating contracts container...");
    const contractsObjectId = await SeedObject({
      label: "Contracts",
      name: "contracts",
      fabricBrowserInfo,
      libraryId
    });

    await client.SetByName({
      name: "elv-fabric-browser",
      target: JSON.stringify({
        libraryId,
        accessGroups: accessGroupsObjectId,
        contracts: contractsObjectId
      })
    });
  } catch(e) {
    console.log(e);
    console.error(error.stack);
  }
};


if(process.argv.length !== 3) {
  console.error("Usage: node Seed.js <private-key>");
  process.exit();
}

const wallet = client.GenerateWallet();
const signer = wallet.AddAccount({
  accountName: "seeder",
  privateKey: process.argv[2]
});

client.SetSigner({signer});

client.DeleteName({name: "elv-fabric-browser"});

Seed().then(async () => {
  console.log(await client.GetByName({name: "elv-fabric-browser"}));
});
