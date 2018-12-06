import { connect } from "react-redux";
import Thunk from "../../utils/Thunk";
import {
  SaveAccessGroup,
  ListAccessGroups,
  RemoveAccessGroup, UpdateAccessGroupMembers
} from "../../actions/AccessGroups";
import AccessGroups from "../../components/pages/access_groups/AccessGroups";
import AccessGroup from "../../components/pages/access_groups/AccessGroup";
import AccessGroupForm from "../../components/pages/access_groups/AccessGroupForm";
import AccessGroupMembersForm from "../../components/pages/access_groups/AccessGroupMembersForm";
import {WrapRequest} from "../../actions/Requests";
import {SetCurrentAccount} from "../../actions/Accounts";

const mapStateToProps = state => ({
  requests: state.requests,
  currentAccountAddress: state.accounts.currentAccountAddress,
  ...state.accessGroups
});

const mapDispatchToProps = dispatch =>
  Thunk(
    dispatch,
    [
      WrapRequest,
      SetCurrentAccount,
      ListAccessGroups,
      SaveAccessGroup,
      UpdateAccessGroupMembers,
      RemoveAccessGroup
    ]
  );

export const AccessGroupsContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(AccessGroups);

export const AccessGroupContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(AccessGroup);

export const AccessGroupFormContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(AccessGroupForm);

export const AccessGroupMembersFormContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(AccessGroupMembersForm);
