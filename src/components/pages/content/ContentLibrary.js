import React from "react";
import { Link } from "react-router-dom";
import UrlJoin from "url-join";
import Path from "path";
import ContentIcon from "../../../static/icons/content.svg";
import {LabelledField} from "../../components/LabelledField";
import ClippedText from "../../components/ClippedText";
import {PageHeader} from "../../components/Page";
import {Action, IconButton, Tabs} from "elv-components-js";
import AsyncComponent from "../../components/AsyncComponent";

import {AccessChargeDisplay} from "../../../utils/Helpers";
import Listing from "../../components/Listing";
import {inject, observer} from "mobx-react";
import RefreshIcon from "../../../static/icons/refresh.svg";
import ToggleSection from "../../components/ToggleSection";
import JSONField from "../../components/JSONField";

@inject("libraryStore")
@observer
class ContentLibrary extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      view: "content",
      groupsView: "accessor",
      version: 0,
      pageVersion: 0
    };

    this.PageContent = this.PageContent.bind(this);
    this.ContentObjects = this.ContentObjects.bind(this);
    this.AccessGroups = this.AccessGroups.bind(this);
  }

  LibraryContentTypes() {
    const types = this.props.libraryStore.library.types;

    const contentTypesCount = Object.keys(types).length;

    if(contentTypesCount === 0) { return null; }

    const contentTypes = Object.values(types).map(type => {
      return (
        <Link
          key={`library-content-type-${type.id}`}
          className="inline-link"
          to={UrlJoin("/content-types", type.id)}
        >
          {type.meta.name || type.id}
        </Link>
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

  AccessGroups() {
    const groups = this.props.libraryStore.library[`${this.state.groupsView}Groups`];

    if(!groups) { return []; }

    const groupsInfo = Object.keys(groups).map(address => {
      const group = groups[address];

      return {
        id: address,
        sortKey: (group.name || "zz").toLowerCase(),
        title: group.name || address,
        description: group.description,
        link: UrlJoin("/access-groups", address)
      };
    });

    return groupsInfo.sort((a, b) => a.sortKey.toLowerCase() > b.sortKey.toLowerCase() ? 1 : -1);
  }

  AccessGroupsListing() {
    const type = this.state.groupsView;
    return (
      <div>
        <Tabs
          options={[
            ["Accessors", "accessor"],
            ["Contributors", "contributor"],
            ["Reviewers", "reviewer"]
          ]}
          className="secondary"
          selected={this.state.groupsView}
          onChange={(value) => this.setState({groupsView: value})}
        />
        <Listing
          key={`library-access-group-listing-${this.state.groupsView}`}
          className="compact"
          pageId="LibraryAccessGroups"
          noIcon={true}
          noStatus={true}
          paginate={true}
          count={this.props.libraryStore.library[`${type}GroupsCount`] || 0}
          LoadContent={async ({params}) => {
            await this.props.libraryStore.ListLibraryGroups({
              libraryId: this.props.libraryStore.libraryId,
              type: this.state.groupsView,
              params
            });

            this.setState({listingVersion: this.state.listingVersion + 1});
          }}
          RenderContent={this.AccessGroups}
        />
      </div>
    );
  }

  ContentObjects() {
    if(!this.props.libraryStore.library.objects) { return []; }

    const objects = Object.keys(this.props.libraryStore.library.objects).map(objectId => {
      const object = this.props.libraryStore.library.objects[objectId];

      let status;
      if(object.accessInfo) {
        status = AccessChargeDisplay(object.accessInfo.accessCharge);
      }

      return {
        id: objectId,
        sortKey: (object.name || "zz").toLowerCase(),
        title: object.name || objectId,
        description: object.description,
        status: status,
        icon: object.imageUrl || ContentIcon,
        link: UrlJoin(this.props.match.url, objectId)
      };
    });

    return objects.sort((a, b) => a.sortKey.toLowerCase() > b.sortKey.toLowerCase() ? 1 : -1);
  }

  ObjectListing() {
    return (
      <Listing
        key="library-objects-view"
        pageId="ContentObjects"
        paginate={true}
        page={this.props.libraryStore.library.listingParams.page}
        filter={this.props.libraryStore.library.listingParams.filter}
        count={this.props.libraryStore.library.objectsCount}
        LoadContent={async ({action, params}) => {
          // When reloading or filtering, clear listing cache
          if(action !== Listing.ACTIONS.reload && action !== Listing.ACTIONS.filter) {
            params.cacheId = this.props.libraryStore.library.listingParams.cacheId;
          }

          await this.props.libraryStore.ListContentObjects({
            libraryId: this.props.libraryStore.libraryId,
            params
          });

          this.setState({listingVersion: this.state.listingVersion + 1});
        }}
        RenderContent={this.ContentObjects}
      />
    );
  }

  LibraryImage() {
    if(!this.props.libraryStore.library.imageUrl) { return null; }

    return (
      <div className="object-image">
        <img src={this.props.libraryStore.library.imageUrl}/>
      </div>
    );
  }

  LibraryInfo() {
    const library = this.props.libraryStore.library;

    const description = <ClippedText className="object-description" text={library.description} />;
    const libraryObjectPath = UrlJoin(this.props.match.url, library.libraryObjectId);

    //const count = this.props.count.objects[this.props.libraryStore.libraryId];
    const count = this.props.libraryStore.library.objectsCount;
    const objectCount = count || count === 0 ?
      <LabelledField label="Content Objects" value={count} /> : null;

    const ownerText = library.ownerName ?
      <span>{library.ownerName}<span className="help-text">({library.owner})</span></span> :
      library.owner;

    return (
      <div className="object-info label-box">
        { this.LibraryImage() }
        <LabelledField label="Name">
          { library.name }
        </LabelledField>

        <LabelledField label="Description" alignTop={true}>
          { description }
        </LabelledField>

        <br />

        <LabelledField label="Library ID">
          { this.props.libraryStore.libraryId }
        </LabelledField>

        <LabelledField label={"Library Object"}>
          <Link className="inline-link" to={libraryObjectPath}>
            { library.libraryObjectId }
          </Link>
        </LabelledField>

        <LabelledField label={"Contract Address"}>
          <Link className="inline-link" to={UrlJoin(libraryObjectPath, "contract")}>
            { library.contractAddress }
          </Link>
        </LabelledField>

        <LabelledField label="KMS ID">
          { library.kmsId }
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
    const refreshButton = (
      <IconButton
        className="refresh-button"
        icon={RefreshIcon}
        label="Refresh"
        onClick={() => {
          this.props.libraryStore.ClearLibraryCache({libraryId: this.props.libraryStore.libraryId});
          this.setState({pageVersion: this.state.pageVersion + 1});
        }}
      />
    );

    const backButton = (
      <Action type="link" to={Path.dirname(this.props.match.url)} className="secondary">
        Back
      </Action>
    );


    let contributeButton;
    if(this.props.libraryStore.library.canContribute) {
      contributeButton = (
        <Action type="link" to={UrlJoin(this.props.match.url, "create")}>
          {this.props.libraryStore.library.isContentSpaceLibrary ? "New Content Type" : "Contribute"}
        </Action>
      );
    }

    if(!this.props.libraryStore.library.isOwner) {
      return (
        <div className="actions-container">
          { backButton }
          { contributeButton }
          { refreshButton }
        </div>
      );
    }

    return (
      <div className="actions-container">
        { backButton }
        <Action type="link" to={UrlJoin(this.props.match.url, "edit")}>
          Manage
        </Action>
        <Action type="link" to={UrlJoin(this.props.match.url, "types")}>
          Types
        </Action>
        <Action type="link" to={UrlJoin(this.props.match.url, "groups")}>
          Groups
        </Action>
        { contributeButton }
        { refreshButton }
      </div>
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

    return (
      <div className="page-container contents-page-container">
        { this.Actions() }
        <PageHeader
          header={this.props.libraryStore.library.name}
          subHeader={this.props.libraryStore.library.description}
        />
        { tabs }
        <div className="page-content">
          { this.PageView() }
        </div>
      </div>
    );
  }

  render() {
    return (
      <AsyncComponent
        key={`library-page-${this.state.pageVersion}`}
        Load={
          async () => await this.props.libraryStore.ContentLibrary({
            libraryId: this.props.libraryStore.libraryId
          })
        }
        render={this.PageContent}
      />
    );
  }
}

export default ContentLibrary;
