import React from "react";
import { connect } from "react-redux";
import Thunk from "../../../utils/Thunk";
import Container from "../../Container";
import {SetCurrentAccount} from "../../../actions/Accounts";
import {GetAccessGroup, ListAccessGroupMembers, RemoveAccessGroup} from "../../../actions/AccessGroups";
import AccessGroup from "../../../components/pages/access_groups/AccessGroup";

const mapStateToProps = (state, props) => ({
  accessGroup: state.accessGroups.accessGroups[props.match.params.contractAddress],
  membersCount: state.accessGroups.count.members[props.match.params.contractAddress]
});

const mapDispatchToProps = dispatch =>
  Thunk(
    dispatch,
    [
      SetCurrentAccount,
      GetAccessGroup,
      ListAccessGroupMembers,
      RemoveAccessGroup
    ]
  );

const LoadAccessGroups = async ({props}) => {
  await props.SetCurrentAccount();
  await props.GetAccessGroup({contractAddress: props.contractAddress});
};

const LoadMembers = async ({props, params}) => {
  await props.ListAccessGroupMembers(params);
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
        ListAccessGroupMembers: LoadMembers,
        RemoveAccessGroup: Delete
      }}
    />
  );
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AccessGroupContainer);