import React from "react";
import {LibraryCard, ThreeCard} from "../../components/DisplayCards";
import { Link } from "react-router-dom";
import Path from "path";
import URI from "urijs";
import ContentIcon from "../../../static/icons/content.svg";
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

    for(const contentObject of contentLibrary.contentObjects.sort()) {
      let icon = ContentIcon;

      if(contentObject.HasImage()) {
        icon = contentObject.RepUrl("image");
      }

      objectElements.push(
        <LibraryCard
          key={contentObject.objectId}
          libraryId={contentObject.objectId}
          link={Path.join(this.props.match.url, contentObject.objectId)}
          icon={icon}
          name={contentObject.name}
          description={contentObject.metadata && contentObject.metadata.description}
          title={JSON.stringify(contentObject, null, 2)}
        />
      );
    }

    return (
      <div>
        <h3 className="page-header">{ contentLibrary.name }</h3>
        { objectElements }
      </div>
    );
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
