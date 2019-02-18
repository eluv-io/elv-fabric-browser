import React from "react";
import { connect } from "react-redux";
import Thunk from "../../../utils/Thunk";
import Container from "../../Container";
import {GetAccessGroup, UpdateAccessGroupMembers} from "../../../actions/AccessGroups";
import AccessGroupMembersForm from "../../../components/pages/access_groups/AccessGroupMembersForm";

const mapStateToProps = (state, props) => ({
  accessGroup: state.accessGroups.accessGroups[props.match.params.contractAddress]
});

const mapDispatchToProps = dispatch =>
  Thunk(
    dispatch,
    [
      GetAccessGroup,
      UpdateAccessGroupMembers
    ]
  );

const LoadAccessGroups = async ({props}) => {
  if(!props.createForm) {
    await props.GetAccessGroup({contractAddress: props.contractAddress});
  }
};

const Submit = async ({props, params}) => {
  return await props.UpdateAccessGroupMembers(params);
};

const Component = Container(AccessGroupMembersForm);
const AccessGroupMembersFormContainer = (props) => {
  const contractAddress = props.match.params.contractAddress;

  return (
    <Component
      {...props}
      contractAddress={contractAddress}
      createForm={!contractAddress}
      Load={LoadAccessGroups}
      methods={{
        Submit: Submit
      }}
    />
  );
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AccessGroupMembersFormContainer);
