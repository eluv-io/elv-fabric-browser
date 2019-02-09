import React from "react";
import { Link } from "react-router-dom";
import Path from "path";
import ContentIcon from "../../../static/icons/content.svg";
import RequestPage from "../RequestPage";
import { LabelledField } from "../../components/LabelledField";
import Redirect from "react-router/es/Redirect";
import ClippedText from "../../components/ClippedText";
import {PageHeader} from "../../components/Page";
import PageTabs from "../../components/PageTabs";
import Action from "../../components/Action";
import {AccessChargeDisplay} from "../../../utils/Helpers";
import {ListingContainer} from "../../../containers/pages/Components";

class ContentLibrary extends React.Component {
  constructor(props) {
    super(props);

    const libraryId = this.props.libraryId || this.props.match.params.libraryId;

    this.state = {
      libraryId,
      visibleItems: {},
      view: "content"
    };

    this.PageContent = this.PageContent.bind(this);
    this.RequestComplete = this.RequestComplete.bind(this);
    this.LoadObjects = this.LoadObjects.bind(this);
    this.ContentObjects = this.ContentObjects.bind(this);
  }

  componentDidMount() {
    this.setState({
      requestId: this.props.WrapRequest({
        todo: async () => {
          await this.props.GetContentLibrary({libraryId: this.state.libraryId});
          await this.props.ListContentLibraryGroups({libraryId: this.state.libraryId});
          await this.props.ListAccessGroups();
        }
      })
    });
  }

  async LoadObjects() {
    await this.props.ListContentObjects({libraryId: this.state.libraryId});
  }

  RequestComplete() {
    if(this.state.deleting && this.props.requests[this.state.requestId].completed) {
      this.setState({
        deleted: true
      });
    }

    this.setState({
      library: this.props.libraries[this.state.libraryId]
    });
  }

  DeleteContentLibrary() {
    if(confirm("Are you sure you want to delete this library?")) {
      this.setState({
        requestId: this.props.WrapRequest({
          todo: async () => {
            await this.props.DeleteContentLibrary({libraryId: this.state.libraryId});
          }
        }),
        deleting: true
      });
    }
  }

  DeleteContentLibraryButton() {
    // Don't allow deletion of special content space library
    if(this.state.library.isContentSpaceLibrary) { return null; }

    return (
      <Action className="delete-action" onClick={() => this.DeleteContentLibrary()}>
        Delete
      </Action>
    );
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
      <div className="actions-container">
        <button
          className={"action action-compact action-wide " + (visible ? "" : "secondary")}
          onClick={toggleVisible}
        >
          { toggleButtonText }
        </button>
      </div>
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
        <LabelledField label={label} value={this.ToggleButton(label, id)} />
        { content }
      </div>
    );
  }

  LibraryGroups() {
    if(this.state.library.isContentSpaceLibrary) { return null; }

    // Return if no groups exist
    if(!Object.values(this.state.library.groups).some(groups => groups.length > 0)) { return null; }

    return (
      <div>
        <h3>Groups</h3>
        {
          Object.keys(this.state.library.groups).map(groupType => {
            const groups = this.state.library.groups[groupType];

            // Display nothing if no groups of this type exist
            if (groups.length === 0) {
              return null;
            }

            return (
              <div className="library-groups-info indented" key={"library-group-" + groupType}>
                <h4>{groupType.capitalize()}</h4>
                {
                  groups.map(group => {
                    const accessGroupLink = Path.join("/access-groups", group.address);

                    let header = <h4>Unknown Group</h4>;
                    if(this.props.accessGroups.accessGroups[group.address]) {
                      // Known group - Provide link to group page
                      header = <h4><Link className="inline-link" to={accessGroupLink}>{group.name}</Link></h4>;
                    }

                    return (
                      <div className="group-info indented" key={"library-group-" + groupType + "-" + group.address}>
                        { header }
                        <LabelledField
                          label="Address"
                          value={<Link className="inline-link" to={Path.join(accessGroupLink, "contract")}>{group.address}</Link>}
                        />
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
    if(this.state.library.imageUrl) {
      return (
        <div className="object-image">
          <img src={this.state.library.imageUrl} />
        </div>
      );
    }

    return null;
  }

  LibraryInfo() {
    const description = <ClippedText className="object-description" text={this.state.library.description} />;
    const libraryObjectPath = Path.join(this.props.match.url, this.state.library.libraryObjectId);

    return (
      <div className="object-info label-box">
        { this.LibraryImage() }
        <h3>Content Library Info</h3>
        <LabelledField label={"Library ID"} value={this.state.libraryId} />
        <LabelledField label={"Owner"} value={this.state.library.owner} />
        <LabelledField label={"Description"} value={description} />
        <LabelledField
          label={"Library Object"}
          value={
            <Link className="inline-link" to={libraryObjectPath}>
              {this.state.library.libraryObjectId}
            </Link>
          }
        />
        <LabelledField
          label={"Contract Address"}
          value={
            <Link className="inline-link" to={Path.join(libraryObjectPath, "contract")}>
              {this.state.library.contractAddress}
            </Link>
          }
        />
        <LabelledField label={"Content Objects"} value={this.state.library.objects.length} />
        { this.ToggleSection("Content Types", "content-types", this.state.library.types, true) }
        { this.ToggleSection("Public Metadata", "public-metadata", this.state.library.meta, true) }
        { this.ToggleSection("Private Metadata", "private-metadata", this.state.library.privateMeta, true) }
        { this.LibraryGroups() }
      </div>
    );
  }

  ContentObjects() {
    let objects = [];
    for(const objectId of this.state.library.objects.sort()) {
      const object = this.props.objects[objectId];

      if(!object) { continue; }

      let status;
      if(object.isNormalObject) {
        if(object.status.code !== 0) {
          // Owner or not yet published
          status = object.status.description;
        } else {
          // Published - Show access charge
          status = AccessChargeDisplay(object.baseAccessCharge);
        }
      }

      objects.push({
        id: objectId,
        title: object.name || "Content Object " + objectId,
        description: object.description,
        status: status,
        icon: object.imageUrl || ContentIcon,
        link: Path.join(this.props.match.url, objectId)
      });
    }

    return objects;
  }

  ObjectListing() {
    return (
      <ListingContainer
        pageId="ContentObjects"
        LoadContent={this.LoadObjects}
        RenderContent={this.ContentObjects}
      />
    );
  }

  Actions() {
    let manageGroupsButton;
    let manageTypesButton;
    if(this.state.library.isOwner && !this.state.library.isContentSpaceLibrary) {
      manageGroupsButton = <Action type="link" to={Path.join(this.props.match.url, "groups")}>Manage Groups</Action>;
      manageTypesButton = <Action type="link" to={Path.join(this.props.match.url, "types")}>Manage Types</Action>;
    }

    return (
      <div className="actions-container">
        <Action type="link" to={Path.dirname(this.props.match.url)} className="secondary">Back</Action>
        <Action type="link" to={Path.join(this.props.match.url, "edit")}>Manage Library</Action>
        { manageGroupsButton }
        { manageTypesButton }
        <Action type="link" to={Path.join(this.props.match.url, "create")}>
          { this.state.library.isContentSpaceLibrary ? "New Content Type" : "Contribute" }
        </Action>
        { this.DeleteContentLibraryButton() }
      </div>
    );
  }

  PageContent() {
    if(this.state.deleted) {
      return <Redirect push to={"/content"}/>;
    }

    const tabs = (
      <PageTabs
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
        { this.Actions() }
        <PageHeader header={this.state.library.name} subHeader={this.state.library.description} />
        { tabs }
        <div className="page-content">
          { this.state.view === "content" ? this.ObjectListing() : this.LibraryInfo() }
        </div>
      </div>
    );
  }

  render() {
    return (
      <RequestPage
        pageContent={this.PageContent}
        requestId={this.state.requestId}
        requests={this.props.requests}
        OnRequestComplete={this.RequestComplete}
      />
    );
  }
}

export default ContentLibrary;
