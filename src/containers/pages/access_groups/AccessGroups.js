import React from "react";
import { connect } from "react-redux";
import Thunk from "../../../utils/Thunk";
import Container from "../../Container";
import {ListAccessGroups} from "../../../actions/AccessGroups";
import AccessGroups from "../../../components/pages/access_groups/AccessGroups";

const mapStateToProps = (state) => ({
  accessGroups: state.accessGroups.accessGroups,
  count: state.accessGroups.count.accessGroups
});

const mapDispatchToProps = dispatch =>
  Thunk(
    dispatch,
    [
      ListAccessGroups
    ]
  );

const LoadAccessGroups = async ({props, params}) => {
  await props.ListAccessGroups({params});
};

const Component = Container(AccessGroups);
const AccessGroupsContainer = (props) => {
  return (
    <Component
      {...props}
      methods={{
        ListAccessGroups: LoadAccessGroups,
      }}
    />
  );
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AccessGroupsContainer);
