import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import UrlJoin from "url-join";
import Path from "path";
import ContentIcon from "../../../static/icons/content.svg";
import { LabelledField } from "../../components/LabelledField";
import Redirect from "react-router/es/Redirect";
import ClippedText from "../../components/ClippedText";
import {PageHeader} from "../../components/Page";
import {Action, LoadingElement, Tabs} from "elv-components-js";

import {AccessChargeDisplay} from "../../../utils/Helpers";
import Listing from "../../components/Listing";

class ContentLibrary extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      visibleItems: {},
      view: "content",
      groupsView: "accessor"
    };

    this.PageContent = this.PageContent.bind(this);
    this.ContentObjects = this.ContentObjects.bind(this);
    this.AccessGroups = this.AccessGroups.bind(this);
  }

  ToggleVisible(id) {
    this.setState({
      visibleItems: {
        ...this.state.visibleItems,
        [id]: !this.state.visibleItems[id]
      }
    });
  }

  ToggleButton(label, id) {
    const toggleVisible = () => this.ToggleVisible(id);
    const visible = this.state.visibleItems[id];
    const toggleButtonText = (visible ? "Hide " : "Show ") + label;

    return (
      <Action
        className={visible ? "" : "secondary"}
        onClick={toggleVisible}
      >
        { toggleButtonText }
      </Action>
    );
  }

  ToggleSection(label, id, value, format=true) {
    const visible = this.state.visibleItems[id];

    let content;
    if(visible) {
      if(format) {
        content = <pre className="content-object-data">{JSON.stringify(value, null, 2)}</pre>;
      } else { content = value; }
    }

    return (
      <div className="formatted-data">
        <LabelledField label={label}>
          { this.ToggleButton(label, id) }
        </LabelledField>
        { content }
      </div>
    );
  }

  LibraryContentTypes() {
    const contentTypesCount = Object.keys(this.props.library.types).length;

    if(contentTypesCount === 0) { return null; }

    const contentTypes = Object.values(this.props.library.types).map(type => {
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
    if(!this.props.library.groups) { return []; }

    const groups = Object.keys(this.props.library.groups).map(address => {
      const group = this.props.library.groups[address];

      return {
        id: address,
        sortKey: (group.name || "zz").toLowerCase(),
        title: group.name || address,
        description: group.description,
        link: UrlJoin("/access-groups", address)
      };
    });

    return groups.sort((a, b) => a.sortKey > b.sortKey ? 1 : -1);
  }

  AccessGroupsListing() {
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
          pageId="LibraryAccessGroups"
          noIcon={true}
          noStatus={true}
          paginate={true}
          count={this.props.count.libraryGroups[this.props.libraryId]}
          loadingStatus={this.props.methodStatus.ListContentLibraryGroups}
          LoadContent={({params}) => {
            this.props.methods.ListContentLibraryGroups({type: this.state.groupsView, params});
          }}
          RenderContent={this.AccessGroups}
        />
      </div>
    );
  }

  ContentObjects() {
    if(!this.props.objects) { return []; }

    const objects = Object.keys(this.props.objects).map(objectId => {
      const object = this.props.objects[objectId];

      const status = AccessChargeDisplay(object.accessInfo.accessCharge);

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

    return objects.sort((a, b) => a.sortKey > b.sortKey ? 1 : -1);
  }

  ObjectListing() {
    return (
      <Listing
        key="library-objects-view"
        pageId="ContentObjects"
        paginate={true}
        count={this.props.count.objects[this.props.libraryId]}
        loadingStatus={this.props.methodStatus.ListContentObjects}
        LoadContent={({params}) => {
          params.cacheId = this.props.cacheId;
          this.props.methods.ListContentObjects({libraryId: this.props.libraryId, params});
        }}
        RenderContent={this.ContentObjects}
      />
    );
  }

  LibraryImage() {
    if(this.props.library.imageUrl) {
      return (
        <div className="object-image">
          <img src={this.props.library.imageUrl} />
        </div>
      );
    }

    return null;
  }

  LibraryInfo() {
    const description = <ClippedText className="object-description" text={this.props.library.description} />;
    const libraryObjectPath = UrlJoin(this.props.match.url, this.props.library.libraryObjectId);

    const count = this.props.count.objects[this.props.libraryId];
    const objectCount = count || count === 0 ?
      <LabelledField label="Content Objects" value={count} /> : null;

    return (
      <div className="object-info label-box">
        { this.LibraryImage() }
        <LabelledField label="Name">
          { this.props.library.name }
        </LabelledField>

        <LabelledField label="Description" alignTop={true}>
          { description }
        </LabelledField>

        <br />

        <LabelledField label="Library ID">
          { this.props.libraryId }
        </LabelledField>

        <LabelledField label={"Library Object"}>
          <Link className="inline-link" to={libraryObjectPath}>
            { this.props.library.libraryObjectId }
          </Link>
        </LabelledField>

        <LabelledField label={"Contract Address"}>
          <Link className="inline-link" to={UrlJoin(libraryObjectPath, "contract")}>
            { this.props.library.contractAddress }
          </Link>
        </LabelledField>

        <LabelledField label="KMS ID">
          { this.props.library.kmsId }
        </LabelledField>

        <LabelledField label="Owner">
          { this.props.library.owner }
        </LabelledField>

        { objectCount }

        <br />

        { this.LibraryContentTypes() }
        { this.ToggleSection("Public Metadata", "public-metadata", this.props.library.meta, true) }
        { this.ToggleSection("Private Metadata", "private-metadata", this.props.library.privateMeta, true) }
      </div>
    );
  }

  Actions() {
    const contributeButton = <Action type="link" to={UrlJoin(this.props.match.url, "create")}>{this.props.library.isContentSpaceLibrary ? "New Content Type" : "Contribute"}</Action>;

    let manageGroupsButton, manageTypesButton, deleteLibraryButton;
    if(this.props.library.isOwner && !this.props.library.isContentSpaceLibrary) {
      /*
      const Delete = async () => {
        await Confirm({
          message: "Are you sure you want to delete this library?",
          onConfirm: async () => await this.props.methods.DeleteContentLibrary({libraryId: this.props.libraryId})
        });
      };
      */

      manageGroupsButton = <Action type="link" to={UrlJoin(this.props.match.url, "groups")}>Groups</Action>;
      manageTypesButton = <Action type="link" to={UrlJoin(this.props.match.url, "types")}>Types</Action>;
      //deleteLibraryButton = <Action className="delete-action" onClick={Delete}>Delete</Action>;
    }

    return (
      <div className="actions-container">
        <Action type="link" to={Path.dirname(this.props.match.url)} className="secondary">Back</Action>
        <Action type="link" to={UrlJoin(this.props.match.url, "edit")}>Manage</Action>
        { manageGroupsButton }
        { manageTypesButton }
        { contributeButton }
        { deleteLibraryButton }
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
    if(this.props.methodStatus.DeleteContentLibrary.completed) {
      return <Redirect push to={"/content"}/>;
    }

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
        {this.Actions()}
        <PageHeader header={this.props.library.name} subHeader={this.props.library.description}/>
        {tabs}
        <div className="page-content">
          { this.PageView() }
        </div>
      </div>
    );
  }

  render() {
    return (
      <LoadingElement
        fullPage={true}
        loading={this.props.methodStatus.DeleteContentLibrary.loading}
        render={this.PageContent}
      />
    );
  }
}

ContentLibrary.propTypes = {
  libraryId: PropTypes.string.isRequired,
  library: PropTypes.object.isRequired,
  objects: PropTypes.object.isRequired,
  count: PropTypes.object.isRequired,
  methods: PropTypes.shape({
    ListContentObjects: PropTypes.func.isRequired,
    DeleteContentLibrary: PropTypes.func.isRequired
  })
};

export default ContentLibrary;
