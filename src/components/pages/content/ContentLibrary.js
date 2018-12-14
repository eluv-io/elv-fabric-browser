import React from "react";
import {LibraryCard} from "../../components/DisplayCards";
import { Link } from "react-router-dom";
import Path from "path";
import ContentIcon from "../../../static/icons/content.svg";
import RequestPage from "../RequestPage";
import { LabelledField } from "../../components/LabelledField";
import Redirect from "react-router/es/Redirect";
import Fabric from "../../../clients/Fabric";
import ClippedText from "../../components/ClippedText";

class ContentLibrary extends React.Component {
  constructor(props) {
    super(props);

    const libraryId = this.props.libraryId || this.props.match.params.libraryId;

    this.state = {
      libraryId,
      visibleItems: {},
      isContentSpaceLibrary: Fabric.utils.EqualHash(Fabric.contentSpaceId, libraryId)
    };

    this.PageContent = this.PageContent.bind(this);
    this.RequestComplete = this.RequestComplete.bind(this);
  }

  componentDidMount() {
    this.setState({
      requestId: this.props.WrapRequest({
        todo: async () => {
          await this.props.SetCurrentAccount();
          await this.props.GetContentLibrary({libraryId: this.state.libraryId});
          await this.props.ListContentObjects({libraryId: this.state.libraryId});

          if(!this.state.isContentSpaceLibrary) {
            await this.props.ListContentLibraryGroups({libraryId: this.state.libraryId});
          }
        }
      })
    });
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
    if(this.state.isContentSpaceLibrary) { return null; }

    return (
      <button className="action delete-action" onClick={() => this.DeleteContentLibrary()}>
        Delete Content Library
      </button>
    );
  }

  ContentObjects() {
    let objectElements = [];

    for(const objectId of this.state.library.objects.sort()) {
      const object = this.props.objects[objectId];
      const infoText = this.state.isContentSpaceLibrary ? "" : object.status.description;

      objectElements.push(
        <LibraryCard
          key={object.id}
          libraryId={object.objectId}
          link={Path.join(this.props.match.url, object.id)}
          icon={object.imageUrl || ContentIcon}
          name={object.name}
          isOwner={object.isOwner}
          infoText={infoText}
          description={object.description}
          title={object.name}
        />
      );
    }

    return (
      <div className="object-info label-box">
        <h3>Content</h3>
        {objectElements}
      </div>
    );
  }

  ToggleButton(label, id) {
    const visible = this.state.visibleItems[id];
    const toggleVisible = () => this.setState({
      visibleItems: {
        ...this.state.visibleItems,
        [id]: !visible
      }
    });
    const toggleButtonText = (visible ? "Hide " : "Show ") + label;

    return (
      <div className="actions-container">
        <button
          className={"action action-compact action-wide " + (visible ? "" : "secondary")}
          onClick={toggleVisible}>
          { toggleButtonText }
        </button>
      </div>
    );
  }

  LibraryGroups() {
    if(this.state.isContentSpaceLibrary) { return null; }

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
                    return (
                      <div className="group-info indented" key={"library-group-" + groupType + "-" + group.address}>
                        <h4>{group.name || "Unknown Group"}</h4>
                        <LabelledField label="Address" value={group.address}/>
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

  LibraryMetadata() {
    let metadata;
    if(this.state.visibleItems["meta"]) {
      metadata = <pre className="content-object-data">{JSON.stringify(this.state.library.meta, null, 2)}</pre>;
    }

    let privateMetadata;
    if(this.state.visibleItems["privateMeta"]) {
      privateMetadata = <pre className="content-object-data">{JSON.stringify(this.state.library.privateMeta, null, 2)}</pre>;
    }

    return [
      <div className="formatted-data" key="meta">
        <LabelledField label="Public Metadata" value={this.ToggleButton("Metadata", "meta")} />
        { metadata }
      </div>,
      <div className="formatted-data" key="privateMeta">
        <LabelledField label="Private Metadata" value={this.ToggleButton("Metadata", "privateMeta")} />
        { privateMetadata }
      </div>
    ];
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
        { this.LibraryMetadata() }
        { this.LibraryGroups() }
      </div>
    );
  }

  Actions() {
    let manageGroupsButton;
    if(this.state.library.isOwner && !this.state.isContentSpaceLibrary) {
      manageGroupsButton = <Link to={Path.join(this.props.match.url, "groups")} className="action" >Manage Groups</Link>;
    }

    return (
      <div className="actions-container">
        <Link to={Path.dirname(this.props.match.url)} className="action secondary" >Back</Link>
        <Link to={Path.join(this.props.match.url, "edit")} className="action" >Edit Content Library</Link>
        { manageGroupsButton }
        <Link to={Path.join(this.props.match.url, "create")} className="action" >
          { this.state.isContentSpaceLibrary ? "New Content Type" : "New Content Object" }
        </Link>
        { this.DeleteContentLibraryButton() }
      </div>
    );
  }

  PageContent() {
    if(this.state.deleted) {
      return <Redirect push to={"/content"}/>;
    }

    return (
      <div className="page-container contents-page-container">
        { this.Actions() }
        <div className="object-display">
          <h3 className="page-header">{ this.state.library.name }</h3>
          { this.LibraryInfo() }
          { this.ContentObjects() }
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
