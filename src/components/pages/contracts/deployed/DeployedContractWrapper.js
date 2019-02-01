import React from "react";
import RequestPage from "../../RequestPage";
import {ContractTypes, DetermineContractInterface} from "../../../../utils/Contracts";

// Component wrapper to contain the logic of determining contract type, interface and address
// Figures out contract info and passes it to the specified component in props.contract
export default (Component) => {
  class DeployedContractWrapper extends React.Component {
    constructor(props) {
      super(props);

      const libraryId = this.props.libraryId || this.props.match.params.libraryId;
      const objectId = this.props.match.params.objectId;
      const isAccessGroup = this.props.location.pathname.startsWith("/access-groups");
      const isCustomContentObjectContract = this.props.location.pathname.includes("custom-contract");
      const contractAddressParam = this.props.match.params.contractAddress;

      const {type, description, abi, contractAddress} = DetermineContractInterface({
        libraryId,
        objectId,
        isAccessGroup,
        isCustomContentObjectContract,
        contractAddressParam: contractAddressParam
      });

      this.state = {
        libraryId,
        objectId,
        contract: {
          type,
          address: contractAddress,
          name: description,
          description,
          abi
        },
        visibleMethods: {},
      };

      this.PageContent = this.PageContent.bind(this);
      this.RequestComplete = this.RequestComplete.bind(this);
    }

    /* eslint-disable no-fallthrough */
    componentDidMount() {
      // Determine what needs to be loaded based on contract type
      let todo = async () => {};

      switch (this.state.contract.type) {
        case ContractTypes.library:
          todo = async () => {
            await this.props.GetContentLibrary({libraryId: this.state.libraryId});
          };
          break;

        case ContractTypes.object:
          todo = async () => {
            await this.props.GetContentObject({
              libraryId: this.state.libraryId,
              objectId: this.state.objectId
            });
          };
          break;

        case ContractTypes.customObject:
          todo = async () => {
            await this.props.GetContentObject({
              libraryId: this.state.libraryId,
              objectId: this.state.objectId
            });

            const object = this.props.content.objects[this.state.objectId];
            if(!object.meta.customContract) {
              if(!object.type) { throw Error("Unknown contract"); }

              await this.props.GetContentType({versionHash: object.type});
            }
          };
          break;

        case ContractTypes.contentType:
          todo = async () => {
            await this.props.GetContentObject({
              libraryId: this.state.libraryId,
              objectId: this.state.objectId
            });
          };
          break;

        case ContractTypes.accessGroup:
          todo = async () => {
            await this.ListAccessGroups();
          };

        case ContractTypes.unknown:
          todo = async () => {
            await this.props.ListDeployedContracts();
          };
          break;
      }

      this.setState({
        loadRequestId: this.props.WrapRequest({todo})
      });
    }
    /* eslint-enable no-fallthrough */

    RequestComplete() {
      let library;
      let object;
      let deployedContract;
      let contractAddress = this.state.contract.address;

      // Determine how to extract any missing contract info from loaded resources
      switch (this.state.contract.type) {
        case ContractTypes.library:
          library = this.props.content.libraries[this.state.libraryId];
          this.setState({
            contract: {
              ...this.state.contract,
              name: library.name
            }
          });
          break;

        case ContractTypes.object:
        case ContractTypes.contentType:
          object = this.props.content.objects[this.state.objectId];
          this.setState({
            contract: {
              ...this.state.contract,
              name: "Base Content Contract - " + object.name,
            }
          });
          break;

        case ContractTypes.customObject:
          object = this.props.content.objects[this.state.objectId];

          let contractInfo = object.meta.customContract;

          contractAddress = object.customContractAddress || contractInfo.address;

          if(!contractInfo) {
            const type = this.props.content.types[object.type];
            contractInfo = type.meta.customContract;
            // If factory ABI is specified - that ABI should be used for this contract
            if(contractInfo.factoryAbi) {
              contractInfo.abi = contractInfo.factoryAbi;
            }
          }

          this.setState({
            contract: {
              name: "Custom Contract - " + object.name,
              description: contractInfo.description,
              address: object.customContractAddress,
              abi: contractInfo.abi,
            }
          });
          break;

        case ContractTypes.unknown:
          deployedContract = this.props.deployedContracts[this.state.contract.address];
          this.setState({
            contract: {
              ...this.state.contract,
              name: deployedContract.name,
              description: deployedContract.description,
              abi: deployedContract.abi
            }
          });
          break;
      }

      // Get the contract balance after loading everything
      this.props.GetContractBalance({contractAddress: contractAddress})
        .then(balance => {
          this.setState({
            contract: {
              ...this.state.contract,
              balance
            }
          });
        });
    }

    // After everything has resolved, render the component with the contract info
    PageContent() {
      return <Component {...this.props} {...this.state} />;
    }

    render() {
      return (
        <RequestPage
          requestId={this.state.loadRequestId}
          requests={this.props.requests}
          pageContent={this.PageContent}
          OnRequestComplete={this.RequestComplete}
        />
      );
    }
  }

  return DeployedContractWrapper;
};
