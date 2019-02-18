import React from "react";
import { connect } from "react-redux";
import Thunk from "../../../utils/Thunk";
import Container from "../../Container";
import {SetCurrentAccount} from "../../../actions/Accounts";
import {GetAccessGroup, RemoveAccessGroup} from "../../../actions/AccessGroups";
import AccessGroup from "../../../components/pages/access_groups/AccessGroup";

const mapStateToProps = (state, props) => ({
  accessGroup: state.accessGroups.accessGroups[props.match.params.contractAddress]
});

const mapDispatchToProps = dispatch =>
  Thunk(
    dispatch,
    [
      SetCurrentAccount,
      GetAccessGroup,
      RemoveAccessGroup
    ]
  );

const LoadAccessGroups = async ({props}) => {
  await props.SetCurrentAccount();
  await props.GetAccessGroup({contractAddress: props.contractAddress});
};

const Delete = async ({props, params}) => {
  await props.RemoveAccessGroup(params);
};

const Component = Container(AccessGroup);
const AccessGroupContainer = (props) => {
  const contractAddress = props.match.params.contractAddress;

  return (
    <Component
      {...props}
      contractAddress={contractAddress}
      Load={LoadAccessGroups}
      methods={{
        ListAccessGroupMembers: LoadAccessGroups,
        RemoveAccessGroup: Delete
      }}
    />
  );
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AccessGroupContainer);
