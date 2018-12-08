import React from "react";
import {Link} from "react-router-dom";
import Path from "path";
import RequestPage from "../RequestPage";
import AppFrame from "../../components/AppFrame";

class ContentObjectApp extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      libraryId: this.props.libraryId || this.props.match.params.libraryId,
      objectId: this.props.match.params.objectId
    };

    this.PageContent = this.PageContent.bind(this);
  }

  componentDidMount() {
    this.setState({
      requestId: this.props.WrapRequest({
        todo: async () => {
          await this.props.SetCurrentAccount();
          await this.props.GetContentObject({
            libraryId: this.state.libraryId,
            objectId: this.state.objectId
          });
        }
      })
    });
  }

  PageContent() {
    let contentObject = this.props.contentObjects[this.state.objectId];

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
        pageContent={this.PageContent}
        requestId={this.state.requestId}
        requests={this.props.requests}
      />
    );
  }
}

export default ContentObjectApp;
