import React from "react";
import UrlJoin from "url-join";
import Path from "path";
import {LabelledField} from "@/components/LabelledField";
import ClippedText from "@/components/ClippedText";
import {PageHeader} from "@/components/Page";

import {observer} from "mobx-react";
import ToggleSection from "@/components/ToggleSection";
import JSONField from "@/components/JSONField";
import ContentLibraryGroupForm from "./ContentLibraryGroupForm";
//import {ContentBrowserModal} from "@/components/ContentBrowser";
import ActionsToolbar from "@/components/ActionsToolbar";
import {DateTime} from "luxon";

import {libraryStore, groupStore, objectStore, routeStore} from "@/stores";
import {Button, CopyableField, IconButton, Linkish} from "@/components/Components";
import {Tabs} from "@mantine/core";
import {modals} from "@mantine/modals";
import {Redirect} from "wouter";

import RemoveIcon from "@/assets/icons/close.svg";
import RefreshIcon from "@/assets/icons/refresh.svg";
import ContentIcon from "@/assets/icons/content.svg";
import AsyncComponent from "@/components/AsyncComponent";
import DataTable from "@/components/DataTable";
import ImageIcon from "@/components/ImageIcon";
import AccessGroupIcon from "@/assets/icons/groups.svg";

class ContentLibrary extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      view: "content",
      groupsView: "accessor",
      version: 0,
      pageVersion: 0,
      showGroupForm: false,
      listingVersion: 0,
      objectId: "",
      loaded: false
    };

    this.PageContent = this.PageContent.bind(this);
    this.ContentObjects = this.ContentObjects.bind(this);
    this.AccessGroups = this.AccessGroups.bind(this);
  }

  LibraryContentTypes() {
    const types = libraryStore.library.types;

    const contentTypesCount = Object.keys(types).length;

    if(contentTypesCount === 0) { return null; }

    const contentTypes = Object.values(types).map(type => {
      return (
        <Linkish
          key={`library-content-type-${type.id}`}
          className="inline-link"
          to={UrlJoin("/content-types", type.id)}
        >
          {type.meta.name || type.id}
        </Linkish>
      );
    });

    return (
      <div>
        <LabelledField label="Content Types" alignTop={true}>
          <div className="comma-separated-list">
            { contentTypes }
          </div>
        </LabelledField>
        <br />
      </div>
    );
  }

  async RemoveAccessGroupPermission({groupAddress}) {
    (modals.openConfirmModal({
      title: "Remove Group Permissions",
      children: "Are you sure you want to remove this group's permissions on this library?",
      onConfirm: async () => {
        await libraryStore.RemoveContentLibraryGroupPermission({
          libraryId: libraryStore.libraryId,
          groupAddress,
          type: this.state.groupsView
        });
      }
    }))();

    this.setState({pageVersion: this.state.pageVersion + 1});
  }

  AccessGroups() {
    const groups = libraryStore.library[`${this.state.groupsView}Groups`];

    if(!groups) { return []; }

    const groupsInfo = Object.keys(groups).map(address => {
      const group = groups[address];
      const status = libraryStore.library.isManager ?
        (
          <div className="listing-action-icon">
            <IconButton
              icon={RemoveIcon}
              label="Remove Access Group"
              onClick={async () => this.RemoveAccessGroupPermission({groupAddress: address})}
            >
              Remove
            </IconButton>
          </div>
        ) : "";

      return {
        id: address,
        sortKey: (group.name || "zz").toLowerCase(),
        title: group.name || address,
        description: group.description,
        status
      };
    });

    return groupsInfo.sort((a, b) => a.sortKey.toLowerCase() > b.sortKey.toLowerCase() ? 1 : -1);
  }

  AccessGroupsListing() {
    const type = this.state.groupsView;
    return (
      <AsyncComponent
        Load={async () => {
          await groupStore.ListAccessGroups({params: {}});
        }}
        render={() => (
          <React.Fragment>
            {
              this.state.loaded && libraryStore.library.isManager &&
                <>
                  <div>
                    <Button onClick={() => this.setState({showGroupForm: true})}>
                      Manage Group Permissions
                    </Button>
                  </div>
                  <Tabs
                    options={[
                      ["View", "accessor"],
                      ["Contribute", "contributor"],
                      ["Manage", "manage"]
                    ]}
                    className="secondary"
                    selected={this.state.groupsView}
                    onChange={(value) => this.setState({groupsView: value})}
                  />
                </>
            }
            <DataTable
              key={`library-access-group-listing-${this.state.groupsView}`}
              totalRecords={libraryStore.library[`${type}GroupsCount`] || 0}
              Load={async ({params}) => {
                await libraryStore.ListLibraryGroups({
                  libraryId: libraryStore.libraryId,
                  type: this.state.groupsView,
                  params
                });
                await libraryStore.ContentLibraryUserPermissions({libraryId: libraryStore.libraryId});
                await libraryStore.ContentLibraryGroupPermissions({libraryId: libraryStore.libraryId});

                this.setState({listingVersion: this.state.listingVersion + 1, loaded: true});
              }}
              records={Object.values(libraryStore.library[`${this.state.groupsView}Groups`])}
              columns={[
                {
                  accessor: "name",
                  sortable: true,
                  render: record => (
                    <Linkish
                      to={UrlJoin("/access-groups", record.address)}
                      className={S("table-item")}
                    >
                      <ImageIcon icon={AccessGroupIcon} className={S("table-item__icon")} />
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
                }
              ]}
            />
            {
              this.state.showGroupForm ?
                <ContentLibraryGroupForm
                  LoadGroups={async () => {
                    await libraryStore.ContentLibraryGroupPermissions({libraryId: libraryStore.libraryId});
                    await libraryStore.ListLibraryGroups({
                      libraryId: libraryStore.libraryId,
                      type: this.state.groupsView,
                      params: {}
                    });
                  }}
                  CloseModal={() => this.setState({showGroupForm: false})}
                /> :
                null
            }
          </React.Fragment>
        )}
      />
    );
  }

  ContentObjects() {
    if(!libraryStore.library.objects) { return []; }

    const objects = Object.keys(libraryStore.library.objects)
      .filter(objectId => !libraryStore.library.objects[objectId].isContentLibraryObject)
      .map(objectId => {
        const object = libraryStore.library.objects[objectId];

        const confirmedAt = object.confirmedAt && DateTime.fromISO(object.confirmedAt);

        return {
          id: objectId,
          sortKey: (object.name || "zz").toLowerCase(),
          title: object.name || objectId,
          subtitle: object.name ? objectId : undefined,
          description: object.description,
          status: confirmedAt && confirmedAt.isValid ? confirmedAt.toFormat("yyyy-MM-dd HH:mm") : "",
          icon: ContentIcon,
          link: UrlJoin(routeStore.path, objectId)
        };
      });

    return objects.sort((a, b) => a.sortKey.toLowerCase() > b.sortKey.toLowerCase() ? 1 : -1);
  }

  ObjectListing() {
    return (
      <DataTable
        key={`library-objects-view-${this.state.objectListingVersion}`}
        totalRecords={libraryStore.library.objectsCount}
        Load={async ({params}) => {
          await libraryStore.ListContentObjects({
            libraryId: libraryStore.libraryId,
            params
          });

          this.setState({listingVersion: this.state.listingVersion + 1});
        }}
        columns={[
          {
            accessor: "name",
            sortable: true,
            render: record => (
              <Linkish
                to={UrlJoin("/content", record.id)}
                className={S("table-item")}
              >
                <ImageIcon icon={ContentIcon} className={S("table-item__icon")} />
                <div className={S("table-item__text")}>
                  <div className={S("table-item__text-primary")}>
                    {record.name || record.id}
                  </div>
                  <CopyableField value={record.id} className={S("table-item__text-secondary")}>
                    {record.id}
                  </CopyableField>
                </div>
              </Linkish>
            )
          }
        ]}
      />
    );
  }

  LibraryInfo() {
    const library = libraryStore.library;

    const description = <ClippedText className="object-description" text={library.description} />;
    const libraryObjectPath = UrlJoin(routeStore.path, library.libraryObjectId);

    //const count = count.objects[libraryStore.libraryId];
    const count = libraryStore.library.objectsCount;
    const objectCount = count || count === 0 ?
      <LabelledField label="Content Objects" value={count} /> : null;

    const ownerText = library.ownerName ?
      <span>{library.ownerName}<span className="help-text">({library.owner})</span></span> :
      library.owner;

    return (
      <div className="object-info label-box">
        <LabelledField label="Name">
          { library.name }
        </LabelledField>

        <LabelledField label="Description" alignTop={true}>
          { description }
        </LabelledField>

        <br />

        <LabelledField label="Library ID">
          { libraryStore.libraryId }
        </LabelledField>

        <LabelledField label={"Library Object"}>
          <Linkish className="inline-link" to={libraryObjectPath}>
            { library.libraryObjectId }
          </Linkish>
        </LabelledField>

        <LabelledField label={"Contract Address"}>
          <Linkish className="inline-link" to={UrlJoin(libraryObjectPath, "contract")}>
            { library.contractAddress }
          </Linkish>
        </LabelledField>

        <LabelledField label="KMS ID">
          { library.kmsId }
        </LabelledField>

        <LabelledField label="Tenant ID">
          { library.tenantId }
        </LabelledField>

        <LabelledField label="Owner">
          { ownerText }
        </LabelledField>

        { objectCount }

        <br />

        { this.LibraryContentTypes() }

        <ToggleSection label="Public Metadata">
          <div className="indented">
            <JSONField json={library.publicMeta} />
          </div>
        </ToggleSection>

        <ToggleSection label="Private Metadata">
          <div className="indented">
            <JSONField json={library.privateMeta} />
          </div>
        </ToggleSection>
      </div>
    );
  }

  Actions() {
    return (
      <ActionsToolbar
        iconActions={[
          {
            className: "refresh-button",
            icon: RefreshIcon,
            label: "Refresh",
            onClick: () => {
              libraryStore.ClearLibraryCache({libraryId: libraryStore.libraryId});
              this.setState({pageVersion: this.state.pageVersion + 1});
            }
          }
        ]}
        actions={[
          {
            label: "Back",
            type: "link",
            path: Path.dirname(routeStore.path),
            className: "secondary"
          },
          {
            label: "Manage",
            type: "link",
            hidden: !(libraryStore.library.isOwner || libraryStore.library.isManager),
            path: UrlJoin(routeStore.path, "edit"),
          },
          {
            label: "Types",
            type: "link",
            hidden: !libraryStore.library.isOwner,
            path: UrlJoin(routeStore.path, "types")
          },
          {
            label: libraryStore.library.isContentSpaceLibrary ? "New Content Type" : "Create",
            type: "link",
            hidden: !libraryStore.library.canContribute,
            path: UrlJoin(routeStore.path, "create")
          },
          {
            label: "Create From Existing",
            type: "button",
            hidden: libraryStore.library.isContentSpaceLibrary || !(libraryStore.library.isManager && libraryStore.library.canContribute),
            onClick: () => this.setState({showCopyObjectModal: true})
          }
        ]}
      />
    );
  }

  PageView() {
    if(this.state.view === "content") {
      return this.ObjectListing();
    } else if(this.state.view === "info") {
      return this.LibraryInfo();
    } else if(this.state.view === "groups") {
      return this.AccessGroupsListing();
    }
  }

  CopyObject = async (object) => {
    const originalObject = object.name ? object : objectStore.object;

    const {id} = await objectStore.CopyContentObject({
      libraryId: object.libraryId,
      originalVersionHash: originalObject.versionHash || originalObject.hash,
      options: {
        meta: {
          public: {
            name: `${originalObject.name} (copy)`
          }
        }
      }
    });

    this.setState({objectId: id});
  }

  PageContent() {
    const tabs = (
      <Tabs
        options={[
          ["Content", "content"],
          ["Library Info", "info"],
          ["Access Groups", "groups"]
        ]}
        selected={this.state.view}
        onChange={(value) => this.setState({view: value})}
      />
    );

    if(this.state.objectId) {
      const redirectPath = UrlJoin(routeStore.path, this.state.objectId);

      return <Redirect to={redirectPath} />;
    }

    return (
      <div className="page-container contents-page-container">
        { this.Actions() }
        <PageHeader
          header={libraryStore.library.name}
          subHeader={libraryStore.library.description}
        />
        { tabs }
        <div className="page-content-container">
          <div className="page-content">
            { this.PageView() }
          </div>
        </div>
        {
          /*
          this.state.showCopyObjectModal ?
            <ContentBrowserModal
              Close={() =>  this.setState({showCopyObjectModal: false})}
              Select={selection => this.CopyObject(selection)}
              DisableObjectCallback={async ({objectId, libraryId}) => {
                const hasPermission = await objectStore.CopyObjectPermission({
                  libraryId,
                  objectId
                });

                return !hasPermission;
              }}
              disableObjectTitle="Ownership or a user cap required"
              confirmMessageCallback={({name, libraryName}) => `Are you sure you want to copy ${name} into ${libraryName}?`}
            /> : null

           */
        }
      </div>
    );
  }

  render() {
    return (
      <AsyncComponent
        key={`library-page-${this.state.pageVersion}`}
        Load={
          async () => await libraryStore.ContentLibrary({
            libraryId: libraryStore.libraryId
          })
        }
        render={this.PageContent}
      />
    );
  }
}

export default ContentLibrary;
