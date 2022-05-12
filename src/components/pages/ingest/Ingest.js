import React from "react";
import ActionsToolbar from "../../components/ActionsToolbar";
import AppFrame from "../../components/AppFrame";
import Path from "path";

class Ingest extends React.Component {

  render() {
    const queryParams = {
      libraryId: this.props.match.params.libraryId
    };

    return (
      <div className="page-container">
        <ActionsToolbar
          actions={[
            {
              label: "Back",
              type: "link",
              path: Path.dirname(this.props.match.url),
              className: "secondary"
            }
          ]}
        />

        <div className="page-content-container form-page">
          <AppFrame
            className="form-frame"
            appUrl={EluvioConfiguration["fabricBrowserApps"]["ingest-media"]}
            queryParams={queryParams}
            onComplete={() => this.setState({pageVersion: this.state.pageVersion + 1})}
            onCancel={() => this.setState({deleted: true})}
          />
        </div>
      </div>
    );
  }
}

export default Ingest;
