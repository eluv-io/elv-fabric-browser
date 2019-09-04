import React from "react";
import { connect } from "react-redux";
import Thunk from "../../../utils/Thunk";
import Container from "../../Container";
import {
  GetAccessGroup, LeaveAccessGroup,
  ListAccessGroupMembers,
  RemoveAccessGroup,
  RemoveAccessGroupMember
} from "../../../actions/AccessGroups";
import AccessGroup from "../../../components/pages/access_groups/AccessGroup";

const mapStateToProps = (state, props) => ({
  accessGroup: state.accessGroups.accessGroups[props.match.params.contractAddress],
  accessGroupMembers: state.accessGroups.accessGroupMembers[props.match.params.contractAddress] || [],
  accessGroupMembersCount: state.accessGroups.count.accessGroupMembers[props.match.params.contractAddress] || 0
});

const mapDispatchToProps = dispatch =>
  Thunk(
    dispatch,
    [
      GetAccessGroup,
      ListAccessGroupMembers,
      RemoveAccessGroupMember,
      RemoveAccessGroup,
      LeaveAccessGroup
    ]
  );

const LoadAccessGroup = async ({props}) => {
  await props.GetAccessGroup({contractAddress: props.contractAddress});
};

const LoadMembers = async ({props, params}) => {
  await props.ListAccessGroupMembers(params);
};

const RemoveMember = async ({props, params}) => {
  await props.RemoveAccessGroupMember(params);
};

const Leave = async ({props, params}) => {
  await props.LeaveAccessGroup(params);
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
      Load={LoadAccessGroup}
      methods={{
        ListAccessGroupMembers: LoadMembers,
        RemoveAccessGroupMember: RemoveMember,
        RemoveAccessGroup: Delete,
        LeaveAccessGroup: Leave
      }}
    />
  );
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AccessGroupContainer);
