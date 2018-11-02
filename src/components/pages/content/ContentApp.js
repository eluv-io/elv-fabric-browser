import React from "react";
import {Link} from "react-router-dom";
import Path from "path";
import RequestPage from "../RequestPage";
import AppFrame from "../../components/AppFrame";

class ContentObjectApp extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      libraryId: this.props.match.params.libraryId,
      objectId: this.props.match.params.objectId
    };
  }

  componentDidMount() {
    let requestId = this.props.GetContentObjectMetadata({
      libraryId: this.state.libraryId,
      objectId: this.state.objectId
    });

    this.setState({
      requestId: requestId
    });
  }

  ContentObjectApp() {
    let contentObject = this.props.contentObjects[this.state.objectId];

    if(!contentObject) { return null; }

    return (
      <div className="page-container content-page-container">
        <div className="actions-container">
          <Link to={Path.dirname(this.props.match.url)} className="action secondary" >Back</Link>
        </div>
        <AppFrame className="fullscreen-app" encodedApp={contentObject.metadata.app} />
      </div>
    );
  }

  render() {
    return (
      <RequestPage
        pageContent={this.ContentObjectApp()}
        requestId={this.state.requestId}
        requests={this.props.requests}
      />
    );
  }
}

export default ContentObjectApp;
