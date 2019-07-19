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
import {Action, Confirm, LoadingElement, Tabs} from "elv-components-js";

import {AccessChargeDisplay} from "../../../utils/Helpers";
import Listing from "../../components/Listing";

class ContentLibrary extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      visibleItems: {},
      view: "content"
    };

    this.PageContent = this.PageContent.bind(this);
    this.ContentObjects = this.ContentObjects.bind(this);
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

  LibraryGroups() {
    if(this.props.library.isContentSpaceLibrary) { return null; }

    // Return if no groups exist
    if(!Object.values(this.props.library.groups).some(groups => groups.length > 0)) { return null; }

    return (
      <div>
        <h3>Groups</h3>
        {
          Object.keys(this.props.library.groups).map(groupType => {
            const groups = this.props.library.groups[groupType];

            // Display nothing if no groups of this type exist
            if(groups.length === 0) {
              return null;
            }

            return (
              <div className="library-groups-info indented" key={"library-group-" + groupType}>
                <h4>{groupType.capitalize()}</h4>
                {
                  groups.map(group => {
                    const accessGroupLink = UrlJoin("/access-groups", group.address);

                    let groupInfo = <h4>Unknown Group</h4>;
                    if(this.props.accessGroups[group.address]) {
                      // Known group - Provide link to group page
                      groupInfo = (
                        <Link className="inline-link" to={accessGroupLink}>
                          {this.props.accessGroups[group.address].name}
                        </Link>
                      );
                    }

                    return (
                      <div className="group-info indented" key={"library-group-" + groupType + "-" + group.address}>
                        <LabelledField label="Group">
                          { groupInfo }
                        </LabelledField>

                        <LabelledField label="Address">
                          <Link className="inline-link" to={UrlJoin(accessGroupLink, "contract")}>{group.address}</Link>
                        </LabelledField>
                      </div>
                    );
                  })
                }

              </div>
            );
          })
        }
      </div>
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

        <LabelledField label="Library ID" copyValue={this.props.libraryId}>
          { this.props.libraryId }
        </LabelledField>

        <LabelledField label="Owner" copyValue={this.props.library.owner}>
          { this.props.library.owner }
        </LabelledField>

        <LabelledField label={"Library Object"} copyValue={this.props.library.libraryObjectId}>
          <Link className="inline-link" to={libraryObjectPath}>
            { this.props.library.libraryObjectId }
          </Link>
        </LabelledField>

        <LabelledField label={"Contract Address"} copyValue={this.props.library.contractAddress}>
          <Link className="inline-link" to={UrlJoin(libraryObjectPath, "contract")}>
            { this.props.library.contractAddress }
          </Link>
        </LabelledField>

        { objectCount }

        <br />

        { this.LibraryContentTypes() }
        { this.ToggleSection("Public Metadata", "public-metadata", this.props.library.meta, true) }
        { this.ToggleSection("Private Metadata", "private-metadata", this.props.library.privateMeta, true) }
        { this.LibraryGroups() }
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

  Actions() {
    const contributeButton = <Action type="link" to={UrlJoin(this.props.match.url, "create")}>{this.props.library.isContentSpaceLibrary ? "New Content Type" : "Contribute"}</Action>;

    let manageGroupsButton, manageTypesButton, deleteLibraryButton;
    if(this.props.library.isOwner && !this.props.library.isContentSpaceLibrary) {
      const Delete = async () => {
        await Confirm({
          message: "Are you sure you want to delete this library?",
          onConfirm: async () => await this.props.methods.DeleteContentLibrary({libraryId: this.props.libraryId})
        });
      };

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

  PageContent() {
    if(this.props.methodStatus.DeleteContentLibrary.completed) {
      return <Redirect push to={"/content"}/>;
    }

    const tabs = (
      <Tabs
        options={[
          ["Content", "content"],
          ["Library Info", "info"]
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
          {this.state.view === "content" ? this.ObjectListing() : this.LibraryInfo()}
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
  accessGroups: PropTypes.object.isRequired,
  objects: PropTypes.object.isRequired,
  count: PropTypes.object.isRequired,
  methods: PropTypes.shape({
    ListContentObjects: PropTypes.func.isRequired,
    DeleteContentLibrary: PropTypes.func.isRequired
  })
};

export default ContentLibrary;
