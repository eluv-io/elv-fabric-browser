/*
import React from "react";
import { Link } from "react-router-dom";
import UrlJoin from "url-join";
import Path from "path";
import {LabelledField} from "@/components/LabelledField";
import ClippedText from "@/components/ClippedText";
import {Redirect} from "react-router";
import {PageHeader} from "@/components/Page";
import {Confirm, IconButton, LoadingElement, Tabs} from "elv-components-js";
import Listing from "@/components/Listing";
import RemoveIcon from "@/assets/icons/close.svg";
import AsyncComponent from "elv-components-js/src/components/AsyncComponent";
import JSONField from "@/components/JSONField";
import ToggleSection from "@/components/ToggleSection";
import ContentObjectGroups from "@/pages/content/ContentObjectGroups";
import ActionsToolbar from "@/components/ActionsToolbar";
import {observer} from "mobx-react";
import {groupStore} from "@/stores";

class AccessGroup extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      visibleElements: {},
      view: "members",
      listingVersion: 0,
      permissionChanging: false
    };

    this.PageContent = this.PageContent.bind(this);
    this.DeleteAccessGroup = this.DeleteAccessGroup.bind(this);
    this.AccessGroupMembers = this.AccessGroupMembers.bind(this);
    this.RemoveAccessGroupMember = this.RemoveAccessGroupMember.bind(this);
    this.LeaveAccessGroup = this.LeaveAccessGroup.bind(this);
  }

  async DeleteAccessGroup() {
    await Confirm({
      message: "Are you sure you want to delete this access group?",
      onConfirm: async () => {
        await groupStore.RemoveAccessGroup({
          address: groupStore.contractAddress
        });

        this.setState({redirect: true});
      }
    });
  }

  async RemoveAccessGroupMember(memberAddress) {
    const manager = this.state.view === "managers";

    await Confirm({
      message: `Are you sure you want to remove this ${manager ? "manager" : "member"} from the group?`,
      onConfirm: async () => await groupStore.RemoveAccessGroupMember({
        contractAddress: groupStore.contractAddress,
        memberAddress,
        manager
      })
    });

    if(this.state.listingRef) {
      this.state.listingRef.Load();
    }
  }

  async LeaveAccessGroup() {
    await Confirm({
      message: "Are you sure you want to leave this group?",
      onConfirm: async () => {
        await groupStore.LeaveAccessGroup({
          contractAddress: groupStore.contractAddress
        });

        this.setState({redirect: true});
      }
    });
  }

  AccessGroupMembers() {
    const members = this.state.view === "managers" ?
      groupStore.accessGroup.managers :
      groupStore.accessGroup.members;

    if(!members) { return []; }

    const memberInfo = Object.values(members).map(member => {
      const canRemove = (
        groupStore.accessGroup.isManager ||
        groupStore.accessGroup.isOwner
      );

      return {
        id: member.address,
        sortKey: member.name || "zz",
        key: `${this.state.view}-${member.address}`,
        title: member.name,
        description: member.address,
        status: (this.state.view === "members" || groupStore.accessGroup.isOwner) ? (
          <div className="listing-action-icon">
            <IconButton
              icon={RemoveIcon}
              label={`Remove ${this.state.view === "managers" ? "Manager" : "Member"}`}
              onClick={async () => await this.RemoveAccessGroupMember(member.address)}
              hidden={!canRemove}
            >
              Remove
            </IconButton>
          </div>
        ) : ""
      };
    });

    return memberInfo.sort((a, b) => a.sortKey.toLowerCase() > b.sortKey.toLowerCase() ? 1 : -1);
  }

  AccessGroupMembersListing() {
    const count = this.state.view === "managers" ?
      groupStore.accessGroup.managersCount :
      groupStore.accessGroup.membersCount;

    return (
      <Listing
        ref={ref => {
          if(!this.state.listingRef) {
            this.setState({listingRef: ref});
          }
        }}
        key={`${this.state.view}-listing`}
        className="compact"
        pageId="AccessGroupMembers"
        paginate={true}
        count={count}
        LoadContent={async ({params}) => {
          await groupStore.ListAccessGroupMembers({
            contractAddress: groupStore.contractAddress,
            showManagers: this.state.view === "managers",
            params
          });

          this.setState({listingVersion: this.state.listingVersion + 1});
        }}
        RenderContent={this.AccessGroupMembers}
        noIcon={true}
        noLink={true}
      />
    );
  }

  Actions() {
    return (
      <ActionsToolbar
        actions={[
          {
            label: "Back",
            type: "link",
            path: Path.dirname(this.props.match.url),
            className: "secondary"
          },
          {
            label: "Manage",
            type: "link",
            hidden: !groupStore.accessGroup.isOwner,
            path: UrlJoin(this.props.match.url, "edit"),
          },
          {
            label: "Add Member",
            type: "link",
            hidden: !(groupStore.accessGroup.isManager || groupStore.accessGroup.isOwner),
            path: UrlJoin(this.props.match.url, "add-member")
          },
          {
            label: "Leave Group",
            type: "button",
            hidden: groupStore.accessGroup.isOwner ||
              !(
                groupStore.accessGroup.isManager
              ),
            onClick: () => this.LeaveAccessGroup(),
            className: "danger"
          },
          {
            label: "Delete",
            type: "button",
            hidden: (true || !groupStore.accessGroup.isOwner),
            onClick: () => this.DeleteAccessGroup(),
            className: "danger"
          }
        ]}
      />
    );
  }

  PageContent() {
    if(this.state.redirect) {
      return <Redirect push to={Path.dirname(this.props.match.url)}/>;
    }

    const group = groupStore.accessGroup;

    const ownerText = group.ownerName ?
      <span>{group.ownerName}<span className="help-text">({group.owner})</span></span> :
      group.owner;

    let oauthIssuer, oauthGroups, metadata, permissions, description, tenantId;
    if(group.oauthInfo) {
      oauthIssuer = (
        <LabelledField label="OAuth Issuer">
          { group.oauthInfo.issuer }
        </LabelledField>
      );

      if(group.oauthInfo.claims && group.oauthInfo.claims.groups) {
        oauthGroups = (
          <LabelledField label="OAuth Groups">
            { Array.isArray(group.oauthInfo.claims.groups) ? group.oauthInfo.claims.groups.join(", ") : group.oauthInfo.claims.groups }
          </LabelledField>
        );
      }
    }

    if(group.isOwner || group.isManager || group.isMember || group.hasAccess) {
      description = (
        <LabelledField label="Description">
          <ClippedText className="object-description" text={group.description} />
        </LabelledField>
      );
    }

    if(group.isOwner || group.isManager || group.isMember) {
      metadata = (
        <ToggleSection label="Metadata">
          <div className="indented">
            <JSONField json={group.metadata} />
          </div>
        </ToggleSection>
      );
    }

    if(group.isOwner || group.isManager || group.isMember || group.hasAccess) {
      tenantId = (
        <LabelledField label="Tenant ID">
          { group.tenantId || "" }
        </LabelledField>
      );
    }

    if(group.isOwner || group.isManager || group.isMember || group.hasAccess) {
      permissions = (
        <LabelledField label="Permissions">
          <LoadingElement loading={this.state.permissionChanging} loadingClassname="visibility-info-loading">
            <select
              value={groupStore.accessGroup.visibility}
              disabled={!groupStore.accessGroup.isManager && !groupStore.accessGroup.isOwner}
              onChange={
                async event => {
                  this.setState({permissionChanging: true});
                  try {
                    await groupStore.SetGroupVisibility({
                      visibility: event.target.value
                    });

                    await new Promise(resolve => setTimeout(resolve, 1000));
                  } finally {
                    this.setState({permissionChanging: false});
                  }
                }
              }
            >
              <option value={1}>Publicly Listable</option>
              <option value={0}>Members Only</option>
            </select>
          </LoadingElement>
        </LabelledField>
      );
    }

    let pageContent;
    if(this.state.view === "groups") {
      pageContent = (
        <ContentObjectGroups
          currentPage="accessGroup"
          showGroupPermissionsButton={groupStore.accessGroup.isManager || groupStore.accessGroup.isOwner}
          LoadGroupPermissions={async () => {
            await groupStore.AccessGroupGroupPermissions({contractAddress: groupStore.contractAddress});
            await groupStore.SetInheritedGroupAccess();
          }}
        />
      );
    } else {
      pageContent = this.AccessGroupMembersListing();
    }

    return (
      <div className="page-container access-group-page-container">
        { this.Actions() }
        <PageHeader header={group.name} />
        <div className="page-content-container">
          <div className="page-content">
            <div className="label-box">
              { description }

              <LabelledField label="Owner">
                { ownerText }
              </LabelledField>

              <LabelledField label="Contract Address">
                <Link className="inline-link" to={UrlJoin(this.props.match.url, "contract")}>
                  { group.address }
                </Link>
              </LabelledField>

              { tenantId }
              { permissions }
              { oauthIssuer }
              { oauthGroups }
              { metadata }
            </div>
            {
              (
                groupStore.accessGroup.isOwner ||
                groupStore.accessGroup.isManager ||
                groupStore.accessGroup.isMember ||
                groupStore.accessGroup.hasAccess
              ) &&
              <>
                <Tabs
                  options={[
                    ["Members", "members"],
                    ["Managers", "managers"],
                    ["Groups", "groups"]
                  ]}
                  selected={this.state.view}
                  onChange={(value) => this.setState({view: value})}
                />
                { pageContent }
              </>
            }
          </div>
        </div>
      </div>
    );
  }

  render() {
    return (
      <AsyncComponent
        Load={
          async () => {
            await groupStore.AccessGroup({
              contractAddress: groupStore.contractAddress
            });

            await groupStore.AccessGroupGroupPermissions({contractAddress: groupStore.contractAddress});
            await groupStore.SetInheritedGroupAccess();

            if(
              groupStore.accessGroup.visibility === 0 &&
              !groupStore.accessGroup.hasAccess &&
              !groupStore.accessGroup.isMember &&
              !groupStore.accessGroup.isOwner &&
              !groupStore.accessGroup.isManager
            ) {
              throw Error("Forbidden");
            }
          }
        }
        render={this.PageContent}
      />
    );
  }
}

export default observer(AccessGroup);


 */

import {observer} from "mobx-react";
import ActionsToolbar from "@/components/ActionsToolbar";
import {groupStore, libraryStore, objectStore} from "@/stores";
import AsyncComponent from "@/components/AsyncComponent";
import {useState} from "react";
import {
  Confirm,
  CopyableField,
  IconButton,
  LabelledField,
  Linkish,
  PageHeader,
  ToggleSection
} from "@/components/Components";
import {useLocation, useParams} from "wouter";
import UrlJoin from "url-join";
import JSONField from "@/components/JSONField";
import {CreateModuleClassMatcher, FormatAddress, ValidAddress} from "@/utils/Helpers";
import {Checkbox, Select, Tabs, Textarea, TextInput, Tooltip} from "@mantine/core";
import ImageIcon from "@/components/ImageIcon";
import DataTable from "@/components/DataTable";

import UserIcon from "@/assets/icons/accounts.svg";
import RemoveIcon from "@/assets/icons/trash.svg";
import RefreshIcon from "@/assets/icons/refresh.svg";
import {FormModal} from "@/components/Form";
import ContentObjectGroups from "@/pages/content/ContentObjectGroups";

const S = CreateModuleClassMatcher();

const AddMemberForm = observer(({Reload, Close}) => {
  const [formData, setFormData] = useState({address: "", manager: false});
  const [addressValid, setAddressValid] = useState(true);

  return (
    <FormModal
      modalProps={{
        opened: true,
        centered: true
      }}
      legend={`Add member to ${groupStore.accessGroup?.name}`}
      onSubmit={async () => {
        if(!(await groupStore.IsSameTenant({userAddress: formData.address}))) {
          if(!(
            await Confirm({
              title: "Confirm Member",
              content: "Warning: This user is associated with a different tenancy. Are you sure you want to add them to this group?"
            })
          )) {
            return false;
          }
        }

        await groupStore.AddAccessGroupMember({
          contractAddress: groupStore.contractAddress,
          memberAddress: formData.address,
          manager: formData.manager
        });

        Reload();
      }}
      validationError={
        addressValid ? null :
          "Invalid Address"
      }
      Close={Close}
    >
      <TextInput
        label="Address"
        placeholder="Address..."
        required
        autoComplete="off"
        onBlur={() => {
          const address = FormatAddress(formData.address);

          setFormData({...formData, address});
          setAddressValid(!address || ValidAddress(address));
        }}
        value={formData.address}
        onChange={event => setFormData({...formData, address: event.target.value})}
      />
      <Checkbox
        label="Manager"
        checked={formData.manager}
        onChange={event => setFormData({...formData, manager: event.target.checked})}
      />
    </FormModal>
  );
});

const Actions = observer(({Reload, ReloadMembers}) => {
  const [location] = useLocation();
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);

  return (
    <>
      <ActionsToolbar
        iconActions={[
          {
            icon: RefreshIcon,
            label: "Refresh",
            onClick: Reload
          }
        ]}
        actions={[
          {
            label: "Back",
            type: "link",
            path: "/access-groups",
            variant: "secondary"
          },
          {
            label: "Manage",
            type: "link",
            hidden: !groupStore.accessGroup.isOwner,
            path: UrlJoin(location, "edit"),
          },
          {
            label: "Add Member",
            type: "link",
            hidden: !(groupStore.accessGroup.isManager || groupStore.accessGroup.isOwner),
            onClick: () => setShowAddMemberForm(true)
          },
          {
            label: "Leave Group",
            type: "button",
            hidden: groupStore.accessGroup.isOwner || !groupStore.accessGroup.isManager,
            onClick: async () => {
              await Confirm({
                title: "Leave Access Group",
                content: "Are you sure you want to leave this group?",
                onConfirm: async () => {
                  await groupStore.LeaveAccessGroup({
                    contractAddress: groupStore.contractAddress
                  });

                  Reload();
                }
              });
            },
          },
          {
            label: "Delete",
            type: "button",
            dividerAbove: true,
            hidden: (true || !groupStore.accessGroup.isOwner),
            onClick: () => this.DeleteAccessGroup(),
          }
        ]}
      />
      {
        !showAddMemberForm ? null :
          <AddMemberForm
            Reload={ReloadMembers}
            Close={() => setShowAddMemberForm(false)}
          />
      }
    </>
  );
});

const Members = observer(({tab}) => {
  const [reloadKey, setReloadKey] = useState(1);

  const canRemove = (
    groupStore.accessGroup.isManager ||
    groupStore.accessGroup.isOwner
  );

  return (
    <DataTable
      key={`table-${tab}-${reloadKey}`}
      records={
        Object.values(
          (tab === "managers" ?
            groupStore.accessGroup.managers :
            groupStore.accessGroup.members) || {}
        )
      }
      totalRecords={
        tab === "managers" ?
          groupStore.accessGroup.managersCount :
          groupStore.accessGroup.membersCount
      }
      Load={async params => await groupStore.ListAccessGroupMembers({
        contractAddress: groupStore.accessGroup.address,
        showManagers: tab === "managers",
        params
      })}
      columns={[
        {
          accessor: "name",
          sortable: true,
          render: record => (
            <div className={S("table-item")}>
              <div className={S("table-item__icon")}><ImageIcon icon={UserIcon}/></div>
              <div className={S("table-item__text")}>
                <div className={S("table-item__text-primary")}>
                  {record.name}
                </div>
                <CopyableField value={record.address} className={S("table-item__text-secondary")}>
                  {record.address}
                </CopyableField>
              </div>
            </div>
          )
        },
        {
          accessor: "actions",
          title: "",
          hidden: !canRemove,
          width: 50,
          render: record =>
            <div className={S("table-item", "table-item--actions")}>
              <IconButton
                icon={RemoveIcon}
                size="sm"
                label={`Remove ${tab === "managers" ? "Manager" : "Member"}`}
                onClick={async () => await Confirm({
                  title: `Remove Access Group ${tab === "managers" ? "Manager" : "Member"}`,
                  content: `Are you sure you want to remove this ${tab === "managers" ? "manager" : "member"} from the group?`,
                  onConfirm: async () => {
                    await groupStore.RemoveAccessGroupMember({
                      contractAddress: groupStore.contractAddress,
                      memberAddress: record.address,
                      manager: tab === "managers"
                    });

                    setReloadKey(reloadKey + 1);
                  }
                })}
              />
            </div>
        }
      ]}
    />
  );
});

const Permissions = observer(({Reload}) => {
  const [updating, setUpdating] = useState(false);

  const group = groupStore.accessGroup;

  if(!(group.isOwner || group.isManager || group.isMember || group.hasAccess)) {
    return null;
  }

  return (
    <LabelledField label="Permissions">
      <Select
        miw={250}
        loading={updating}
        disabled={!groupStore.accessGroup.isManager && !groupStore.accessGroup.isOwner}
        value={groupStore.accessGroup.visibility}
        data={[
          { label: "Publicly Listable", value: "1" },
          { label: "Members Only", value: "0" }
        ]}
        onChange={
          async newPermission => {
            setUpdating(true);
            try {
              await groupStore.SetGroupVisibility({visibility: parseInt(newPermission)});

              await new Promise(resolve => setTimeout(resolve, 1000));
              Reload();
            } finally {
              setUpdating(false);
            }
          }
        }
      />
    </LabelledField>
  );
});

const PageContent = observer(({Reload}) => {
  const [location] = useLocation();
  const [tab, setTab] = useState("members");
  const [membersReloadKey, setMembersReloadKey] = useState(0);
  const group = groupStore.accessGroup;

  if(!group) { return; }

  return (
    <div className="page-container">
      <Actions
        Reload={Reload}
        ReloadMembers={() => setMembersReloadKey(membersReloadKey + 1)}
      />
      <PageHeader
        header={`Access Groups / ${group.name || group.address}`}
        subHeader={<CopyableField value={group.address}>{group.address}</CopyableField>}
      />
      <LabelledField label="Owner" copyValue={group.owner}>
        {
          group.ownerName ?
            <span className={S("inline-text")}>
              <span>{group.ownerName}</span>
              <span className={S("help-text")}>
                ({group.owner})
              </span>
            </span> :
            group.owner
        }
      </LabelledField>
      <LabelledField label="Tenant ID" copyValue={group.tenantId}>
        {group.tenantId || ""}
      </LabelledField>
      <LabelledField key="contract-address" label="Contract Address">
        <Linkish className="inline-link" to={UrlJoin(location, "contract")}>
          {group.address}
        </Linkish>
      </LabelledField>

      {
        !group.oauthInfo ? null :
          <>
            <LabelledField label="OAuth Issuer">
              {group.oauthInfo.issuer}
            </LabelledField>
            {
              !group.oauthInfo.claims || !group.oauthInfo.claims.groups ? null :
                <LabelledField label="OAuth Groups">
                  {Array.isArray(group.oauthInfo.claims.groups) ? group.oauthInfo.claims.groups.join(", ") : group.oauthInfo.claims.groups}
                </LabelledField>
            }
          </>
      }
      <Permissions Reload={Reload}/>
      <LabelledField label="Description" value={group.description || ""}/>

      <br/>
      <ToggleSection label="Metadata">
        <JSONField
          json={group.metadata}
          className={S("component")}
        />
      </ToggleSection>

      <br/>
      <Tabs my="md" value={tab} onChange={setTab}>
        <Tabs.List>
          <Tabs.Tab value="members">Members</Tabs.Tab>
          <Tabs.Tab value="managers">Managers</Tabs.Tab>
          <Tabs.Tab value="groups">Groups</Tabs.Tab>
        </Tabs.List>
      </Tabs>
      {
        tab === "groups" ?
          <ContentObjectGroups
            type="accessGroup"
            addressOrId={group.address}
          /> :
          <Members tab={tab} key={membersReloadKey} />
      }
    </div>
  );
});

const AccessGroupPage = observer(() => {
  const [reloadKey, setReloadKey] = useState(Math.random());

  return (
    <AsyncComponent
      key={`page-${reloadKey}`}
      Load={
        async () => {
          await groupStore.AccessGroup({
            contractAddress: groupStore.contractAddress
          });

          await groupStore.AccessGroupGroupPermissions({contractAddress: groupStore.contractAddress});
          await groupStore.SetInheritedGroupAccess();

          if(
            groupStore.accessGroup.visibility === 0 &&
            !groupStore.accessGroup.hasAccess &&
            !groupStore.accessGroup.isMember &&
            !groupStore.accessGroup.isOwner &&
            !groupStore.accessGroup.isManager
          ) {
            throw Error("Forbidden");
          }
        }
      }
      render={() => <PageContent Reload={() => setReloadKey(reloadKey + 1)} />}
    />
  );
});

export default AccessGroupPage;
