import React from "react";
import { connect } from "react-redux";
import Thunk from "../../../../utils/Thunk";
import {GetContractBalance, RetrieveContractInfo} from "../../../../actions/Contracts";
import {ContractTypes, DetermineContractInterface} from "../../../../utils/Contracts";
import {LoadingElement} from "elv-components-js";

/*
 * A wrapper container for dealing with all deployed contracts.
 *
 * Because there are many different types of contracts, each of which requires different information,
 * encapsulate that logic in a wrapper container that will ensure that all contract info is loaded prior
 * to rendering.
 */
const ContractInfoContainer = (Component, componentStateToProps, componentDispatchToProps) => {
  const mapStateToProps = (state, props) => ({
    ...componentStateToProps(state, props),
    library: state.content.libraries[props.libraryId || props.match.params.libraryId],
    object: state.content.objects[props.match.params.objectId],
    accessGroup: state.accessGroups.accessGroups[props.match.params.contractAddress],
    deployedContracts: state.contracts.deployedContracts
  });

  const mapDispatchToProps = dispatch =>
    ({
      ...(
        Thunk(
          dispatch,
          [
            RetrieveContractInfo,
            GetContractBalance
          ]
        )
      ),
      ...(componentDispatchToProps(dispatch))
    });


  class ContractInfo extends React.Component {
    constructor(props) {
      super(props);

      const libraryId = props.libraryId || props.match.params.libraryId;
      const objectId = props.match.params.objectId;
      const contractName = props.match.params.contractName;

      const isAccessGroup = props.location.pathname.startsWith("/access-groups");
      const isCustomContentObjectContract = props.location.pathname.includes("custom-contract");
      const contractAddressParam = props.match.params.contractAddress;

      const {type, description, abi, contractAddress} = DetermineContractInterface({
        libraryId,
        objectId,
        isAccessGroup,
        isCustomContentObjectContract,
        contractAddressParam
      });

      this.state = {
        libraryId,
        objectId,
        contractName,
        contract: {
          type,
          name: contractName || description,
          description,
          address: contractAddress,
          abi
        },
        loaded: false,
        setup: false,
      };
    }

    // Load any additional information needed for the contract type
    async componentDidMount() {
      try {
        await this.props.RetrieveContractInfo({
          type: this.state.contract.type,
          libraryId: this.state.libraryId,
          objectId: this.state.objectId
        });

        if(this.state.contract.address && this.state.contract.abi) {
          await this.props.GetContractBalance({
            contractAddress: this.state.contract.address
          });
        }

        this.setState({
          loaded: true
        });
      } catch(error) {
        /* eslint-disable no-console */
        console.error("Failed to load contract info:");
        console.error(error);
        /* eslint-enable no-console */
      }
    }

    // Some contract types require waiting for other information (e.g. object metadata) to load
    async componentDidUpdate() {
      try {
        if(this.state.loaded && !this.state.setup) {
          let contract = this.state.contract;

          // Add additional information about the contract if necessary
          if(contract.type === ContractTypes.customObject) {
            contract = {
              ...contract,
              ...(this.props.object.meta.custom_contract || this.props.object.typeInfo.meta.custom_contract)
            };
          } else if(contract.type === ContractTypes.unknown) {
            contract = {
              ...contract,
              ...(this.props.deployedContracts[contract.address])
            };
          }

          // Preserve contract type description
          contract.description = this.state.contract.description;

          await this.props.GetContractBalance({
            contractAddress: contract.address
          });

          this.setState({
            contract,
            loaded: true,
            setup: true
          });
        }
      } catch(error) {
        /* eslint-disable no-console */
        console.error("Failed to load contract info:");
        console.error(error);
        /* eslint-enable no-console */
      }
    }

    render() {
      return (
        <LoadingElement fullPage={true} loading={!this.state.setup}>
          <Component
            {...this.props}
            libraryId={this.state.libraryId}
            objectId={this.state.objectId}
            contract={this.state.contract}
            deployedContract={this.props.deployedContracts[this.state.contract.address]}
          />
        </LoadingElement>
      );
    }
  }

  return connect(
    mapStateToProps,
    mapDispatchToProps
  )(ContractInfo);
};

export default ContractInfoContainer;
