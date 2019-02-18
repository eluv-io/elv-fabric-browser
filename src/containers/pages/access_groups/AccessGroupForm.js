import React from "react";
import { connect } from "react-redux";
import Thunk from "../../../utils/Thunk";
import Container from "../../Container";
import {GetAccessGroup, SaveAccessGroup} from "../../../actions/AccessGroups";
import AccessGroupForm from "../../../components/pages/access_groups/AccessGroupForm";

const mapStateToProps = (state, props) => ({
  accessGroup: state.accessGroups.accessGroups[props.match.params.contractAddress]
});

const mapDispatchToProps = dispatch =>
  Thunk(
    dispatch,
    [
      GetAccessGroup,
      SaveAccessGroup
    ]
  );

const LoadAccessGroups = async ({props}) => {
  if(!props.createForm) {
    await props.GetAccessGroup({contractAddress: props.contractAddress});
  }
};

const Submit = async ({props, params}) => {
  return await props.SaveAccessGroup(params);
};

const Component = Container(AccessGroupForm);
const AccessGroupFormContainer = (props) => {
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
)(AccessGroupFormContainer);
