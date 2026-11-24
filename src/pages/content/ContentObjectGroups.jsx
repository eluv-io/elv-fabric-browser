/*
import React from "react";
import {Action, AsyncComponent, Confirm, IconButton, Tabs} from "elv-components-js";
import Listing from "@/components/Listing";
import {observer} from "mobx-react";
import PropTypes from "prop-types";

import ContentObjectGroupForm from "./ContentObjectGroupForm";
import RemoveIcon from "@/assets/icons/close.svg";

import {objectStore} from "@/stores";
import {groupStore} from "@/stores";

class ContentObjectGroups extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      view: "access",
      showGroupForm: false,
      filterOptions: {
        params: {
          page: 1,
          perPage: 10,
          filter: ""
        }
      },
      pageVersion: 0,
      loaded: false
    };
  }

  FilterGroups(filterOptions) {
    const page = filterOptions.params.page;
    const perPage = filterOptions.params.perPage;

    const groupsObject = (currentPage === "contentObject" ? (objectStore.objectGroupPermissions || {}) : groupStore.accessGroup.groupPermissions || {});
    let groups = Object
      .values(groupsObject)
      .filter(group => group.permissions.includes(this.state.view))
      .sort((a, b) => (a.name || "zz").toLowerCase() > (b.name || "zz").toLowerCase() ? 1 : -1)
      .slice((page - 1) * perPage, page * perPage);

    if(filterOptions.params.filter) {
      groups = groups.filter(group => group.name.toLowerCase()
        .includes(filterOptions.params.filter.toLowerCase()));
    }

    return groups;
  }

  async RemoveAccessGroupPermission({groupAddress}) {
    let itemText;
    if(this.props.currentPage === "accessGroup") {
      itemText = "group";
    } else if(objectStore.object.isContentType) {
      itemText = "content type";
    } else {
      itemText = "object";
    }

    await Confirm({
      message: `Are you sure you want to remove this group's permissions on this ${itemText}?`,
      onConfirm: async () => {
        await objectStore.RemoveContentObjectGroupPermission({
          objectId: objectStore.objectId,
          groupAddress,
          permission: this.state.view
        });
      }
    });

    if(this.state.listingRef) {
      this.state.listingRef.Load();
    }

    this.setState({pageVersion: this.state.pageVersion + 1});
  }

  AccessGroups() {
    const editCondition = currentPage === "contentObject" ? objectStore.object.canEdit : groupStore.accessGroup.isManager;
    const groupsInfo = this.FilterGroups(this.state.filterOptions).map(group => {
      return {
        id: group.address,
        sortKey: (group.name || "zz").toLowerCase(),
        title: group.name || group.address,
        description: group.description,
        status: editCondition ? (
          <div className="listing-action-icon">
            <IconButton
              icon={RemoveIcon}
              label="Remove Access Group"
              onClick={async () => {
                await this.RemoveAccessGroupPermission({groupAddress: group.address});
                this.props.RefreshCallback();
              }}
            >
              Remove
            </IconButton>
          </div>
        ) : ""
      };
    });

    return groupsInfo.sort((a, b) => a.sortKey.toLowerCase() > b.sortKey.toLowerCase() ? 1 : -1);
  }

  render() {
    const GroupCount = () => {
      return Object
        .values(currentPage === "contentObject" ? (objectStore.objectGroupPermissions || {}) : groupStore.accessGroup.groupPermissions || {})
        .filter(group => group.permissions.includes(this.state.view))
        .length;
    };

    let groupPermissionsButton;
    if(this.props.showGroupPermissionsButton) {
      groupPermissionsButton = (
        <div>
          <Action onClick={() => this.setState({showGroupForm: true})}>
            Manage Group Permissions
          </Action>
        </div>
      );
    }

    const options = [
      ["View", "access"],
      ["Manage", "manage"]
    ];

    if(this.props.currentPage !== "accessGroup") {
      options.unshift(
        ["See", "see"]
      );
    }

    return (
      <AsyncComponent
        Load={async () => {
          if(this.props.currentPage !== "accessGroup") {
            await groupStore.ListAccessGroups({
              params: {},
              publicOnly: true
            });
          }
        }}
        render={() => (
          <React.Fragment>
            {
              this.state.loaded &&
                <>
                  { groupPermissionsButton }
                  <Tabs
                    options={options}
                    className="secondary"
                    selected={this.state.view}
                    onChange={(value) => this.setState({view: value})}
                  />
                </>
            }
            <Listing
              ref={ref => {
                if(!this.state.listingRef) {
                  this.setState({listingRef: ref});
                }
              }}
              key={`object-access-group-listing-${this.state.view}-${this.state.pageVersion}`}
              className="compact"
              pageId="ObjectAccessGroups"
              noIcon={true}
              noLink={true}
              paginate={true}
              count={GroupCount()}
              LoadContent={async (filterOptions) => {
                await this.props.LoadGroupPermissions();
                this.setState({filterOptions, loaded: true});
              }}
              RenderContent={() => this.AccessGroups()}
            />
            {
              this.state.showGroupForm ?
                <ContentObjectGroupForm
                  LoadGroupPermissions={this.props.LoadGroupPermissions}
                  currentPage={this.props.currentPage}
                  CloseModal={() => this.setState({showGroupForm: false, pageVersion: this.state.pageVersion + 1})}/> :
                null
            }
          </React.Fragment>
        )}
      />
    );
  }
}

ContentObjectGroups.propTypes = {
  currentPage: PropTypes.string.isRequired
};

export default observer(ContentObjectGroups);


 */

import {observer} from "mobx-react";
import {useEffect, useState} from "react";
import {groupStore, objectStore} from "@/stores";
import {Checkbox, Select, Tabs, TextInput} from "@mantine/core";
import {CreateModuleClassMatcher, EqualAddress, FormatAddress, ValidAddress} from "@/utils/Helpers";
import {Button, Confirm, CopyableField, IconButton, Linkish} from "@/components/Components";
import DataTable from "@/components/DataTable";
import ImageIcon from "@/components/ImageIcon";
import {FormModal} from "@/components/Form";

import GroupIcon from "@/assets/icons/groups.svg";
import RemoveIcon from "@/assets/icons/trash.svg";
import {useDebouncedValue} from "@mantine/hooks";

const S = CreateModuleClassMatcher();

const AddGroupForm = observer(({type, initialSelection, Reload, Close}) => {
  const groups = Object.values(groupStore.accessGroups)
    .sort((a, b) =>(a?.name || "").toLowerCase() < (b?.name || "").toLowerCase() ? -1 : 1)
    .filter(group => group.address !== groupStore.contractAddress)
    .map(group => ({label: group.name || group.address, value: group.address}));

  const [formData, setFormData] = useState({
    selectedAddress: (
      groups.find(g => EqualAddress(initialSelection, g.value)) || groups[0]
    )?.value || "",
    address: "",
    see: false,
    access: false,
    manage: false
  });

  const [addressValid, setAddressValid] = useState(true);
  const [debouncedAddress] = useDebouncedValue(formData.address, 500);

  useEffect(() => {
    (
      type === "accessGroup" ?
        groupStore.AccessGroupGroupPermissions({contractAddress: groupStore.contractAddress}) :
        objectStore.ContentObjectGroupPermissions({objectId: objectStore.objectId})
    )
      .then(() => {
        const address = FormatAddress(formData.selectedAddress || formData.address);

        const permissions = (
          type === "accessGroup" ?
            groupStore.accessGroup :
            objectStore.object
        )?.groupPermissions?.[address]?.permissions || [];

        setFormData({
          ...formData,
          see: !!permissions.includes("see"),
          access: !!permissions.includes("access"),
          manage: !!permissions.includes("manage")
        });
      });
  }, [debouncedAddress, formData.selectedAddress]);

  return (
    <FormModal
      modalProps={{
        opened: true,
        centered: true
      }}
      legend={`Add group to ${groupStore.accessGroup?.name}`}
      onSubmit={async () => {
        await objectStore.UpdateContentObjectGroupPermissions({
          type,
          objectId: type === "accessGroup" ? undefined : objectStore.objectId,
          accessGroupAddress: type === "accessGroup" ? groupStore.contractAddress : undefined,
          groupAddress: formData.selectedAddress || formData.address,
          see: formData.see,
          access: formData.access,
          manage: formData.manage
        });

        Reload();
      }}
      validationError={
        addressValid ? null :
          "Invalid Address"
      }
      Close={Close}
    >
      <Select
        allowDeselect={false}
        searchable
        clearable
        defaultValue=""
        label="Access Group"
        placeholder="Other"
        openOnFocus={false}
        value={formData.selectedAddress}
        onChange={value => setFormData({...formData, selectedAddress: value})}
        data={groups}
      />
      {
        formData.selectedAddress ? null :
          <TextInput
            label="Address"
            placeholder="Address..."
            required
            autoComplete="off"
            onBlur={() => {
              const address = FormatAddress(formData.address);

              const valid = !address || ValidAddress(address);

              if(valid) {
                setFormData({...formData, address});
                setAddressValid(true);
              } else {
                setAddressValid(false);
              }
            }}
            value={formData.address}
            onChange={event => setFormData({...formData, address: event.target.value})}
          />
      }
      <div className={S("form-title")}>
        Permissions
      </div>
      <div className={S("stack")}>
        <Checkbox
          label="See"
          checked={formData.see}
          onChange={event => setFormData({...formData, see: event.target.checked})}
        />
        <Checkbox
          label="Access"
          checked={formData.access}
          onChange={event => setFormData({...formData, access: event.target.checked})}
        />
        <Checkbox
          label="Manage"
          checked={formData.manage}
          onChange={event => setFormData({...formData, manage: event.target.checked})}
        />
      </div>
    </FormModal>
  );
});

// type: contentObject, accessGroup
const ContentObjectGroups = observer(({type}) => {
  const [tab, setTab] = useState("access");
  const [reloadKey, setReloadKey] = useState(1);
  const [data, setData] = useState({records: [], total: 0});
  const [showAddGroupForm, setShowAddGroupForm] = useState(false);

  useEffect(() => {
    groupStore.ListAccessGroups({params: {}, publicOnly: true});
  }, [groupStore.contractAddress, objectStore.objectId]);

  const Load = async params => {
    if(type === "accessGroup") {
      await groupStore.AccessGroupGroupPermissions({contractAddress: groupStore.contractAddress});
      await groupStore.SetInheritedGroupAccess();
    } else {
      await objectStore.ContentObjectGroupPermissions({objectId: objectStore.objectId});
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    let groups = Object.values(
      (
        type === "accessGroup" ?
          groupStore.accessGroup :
          objectStore.object
      )?.groupPermissions || {}
    )
      .filter(group => group.permissions.includes(tab))
      .filter(group =>
        !params.filter ||
        (group.name || "").toLowerCase().includes(params.filter.toLowerCase()) ||
        (group.address || "").toLowerCase().includes(params.filter.toLowerCase())
      )
      .sort((a, b) =>(a?.name || "").toLowerCase() < (b?.name || "").toLowerCase() ? -1 : 1);

    if(params.sortDirection === "desc") {
      groups = groups.reverse();
    }

    setData({
      records: groups,
      total: groups.length
    });
  };

  return (
    <>
      <div style={{marginBottom: 20}} className={S("inline-apart")}>
        <Tabs
          color="var(--color-button-secondary)"
          variant="pills"
          autoContrast
          value={tab}
          onChange={setTab}
        >
          <Tabs.List>
            <Tabs.Tab value="see">See</Tabs.Tab>
            <Tabs.Tab value="access">View</Tabs.Tab>
            <Tabs.Tab value="manage">Manage</Tabs.Tab>
          </Tabs.List>
        </Tabs>
        <Button onClick={() => setShowAddGroupForm(true)}>
          Manage Group Permissions
        </Button>
      </div>
      <DataTable
        key={`groups-${tab}-${reloadKey}`}
        totalRecords={data.total}
        records={data.records}
        Load={Load}
        columns={[
          {
            accessor: "name",
            sortable: true,
            render: record => (
              <Linkish
                onClick={() => setShowAddGroupForm(record.address)}
                className={S("table-item")}
              >
                <div className={S("table-item__icon")}><ImageIcon icon={GroupIcon}/></div>
                <div className={S("table-item__text")}>
                  <div className={S("table-item__text-primary")}>
                    {record.name}
                  </div>
                  <CopyableField value={record.address} className={S("table-item__text-secondary")}>
                    {record.address}
                  </CopyableField>
                </div>
              </Linkish>
            )
          },
          {
            accessor: "actions",
            title: "",
            hidden: type === "accessGroup" ?
              !(groupStore.accessGroup.isOwner || groupStore.accessGroup.isManager) :
              !objectStore.object.canEdit,
            width: 50,
            render: record =>
              <div className={S("table-item", "table-item--actions")}>
                <IconButton
                  icon={RemoveIcon}
                  size="sm"
                  label={`Remove ${tab === "managers" ? "Manager" : "Member"}`}
                  onClick={async () => await Confirm({
                    title: "Remove Access Group Permission",
                    content: "Are you sure you want to remove this permission?",
                    onConfirm: async () => {
                      await objectStore.RemoveContentObjectGroupPermission({
                        objectId: objectStore.objectId,
                        groupAddress: record.address,
                        permission: tab
                      });

                      setReloadKey(reloadKey + 1);
                    }
                  })}
                />
              </div>
          }
        ]}
      />
      {
        !showAddGroupForm ? null :
          <AddGroupForm
            type={type}
            initialSelection={showAddGroupForm}
            Reload={() => setReloadKey(reloadKey + 1)}
            Close={() => setShowAddGroupForm(false)}
          />
      }
    </>
  );
});

export default ContentObjectGroups;
