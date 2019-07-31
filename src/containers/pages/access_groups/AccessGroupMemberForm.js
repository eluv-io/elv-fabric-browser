import React from "react";
import { connect } from "react-redux";
import Thunk from "../../../utils/Thunk";
import Container from "../../Container";
import {
  AddAccessGroupMember, GetAccessGroup,
} from "../../../actions/AccessGroups";
import AccessGroupMemberForm from "../../../components/pages/access_groups/AccessGroupMemberForm";

const mapStateToProps = (state, props) => ({
  accessGroup: state.accessGroups.accessGroups[props.match.params.contractAddress]
});

const mapDispatchToProps = dispatch =>
  Thunk(
    dispatch,
    [
      AddAccessGroupMember,
      GetAccessGroup
    ]
  );

const LoadAccessGroup = async ({props}) => {
  await props.GetAccessGroup({contractAddress: props.contractAddress});
};

const AddMember = async ({props, params}) => {
  await props.AddAccessGroupMember(params);
};

const Component = Container(AccessGroupMemberForm);
const AccessGroupMemberFormContainer = (props) => {
  const contractAddress = props.match.params.contractAddress;

  return (
    <Component
      {...props}
      contractAddress={contractAddress}
      Load={LoadAccessGroup}
      methods={{
        Submit: AddMember
      }}
    />
  );
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AccessGroupMemberFormContainer);
