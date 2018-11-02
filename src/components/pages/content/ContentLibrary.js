import React from "react";
import { ThreeCard } from "../../components/DisplayCards";
import { Link } from "react-router-dom";
import Path from "path";
import ContentIcon from "../../../static/icons/content.svg";
import Fabric from "../../../clients/Fabric";
import RequestPage from "../RequestPage";

class ContentLibrary extends React.Component {
  constructor(props) {
    super(props);

    this.state = { libraryId: this.props.match.params.libraryId };
  }

  componentDidMount() {
    this.setState({
      requestId: this.props.ListContentObjects({ libraryId: this.state.libraryId })
    });
  }

  ContentObjects() {
    let contentLibrary = this.props.contentLibraries[this.state.libraryId];

    if(!contentLibrary) { return contentLibrary; }

    let objectElements = [];

    for(const contentObject of contentLibrary.contentObjects) {
      let icon = ContentIcon;
      if(contentObject.metadata.image) {
        icon = Fabric.PartUrl({
          libraryId: this.state.libraryId,
          contentHash: contentObject.hash,
          partHash: contentObject.metadata.image
        });
      }

      objectElements.push(
        <ThreeCard
          key={contentObject.objectId}
          link={Path.join(this.props.match.url, contentObject.objectId)}
          icon={icon}
          name={contentObject.name}
          description={"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."}
          title={JSON.stringify(contentObject, null, 2)}
        />
      );
    }

    return objectElements;
  }

  PageContent() {
    return (
      <div className="page-container contents-page-container">
        <div className="actions-container">
          <Link to={Path.dirname(this.props.match.url)} className="action secondary" >Back</Link>
          <Link to={Path.join(this.props.match.url, "create")} className="action" >New Content Object</Link>
        </div>
        <div className="card-container wide-card-container content-objects-container">
          { this.ContentObjects() }
        </div>
      </div>
    );
  }

  render() {
    return (
      <RequestPage
        pageContent={this.PageContent()}
        requestId={this.state.requestId}
        requests={this.props.requests}
      />
    );
  }
}

export default ContentLibrary;
