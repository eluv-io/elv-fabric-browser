import React from "react";
import Events from "../../components/Events";
import ContentLookup from "../../components/ContentLookup";

class EventsPage extends React.Component {
  render() {
    return (
      <div className="page-container">
        <div className="actions-container content-lookup-actions-container">
          <ContentLookup />
        </div>
        <div className="page-header-container">
          <h3 className="page-header">Blockchain Events</h3>
        </div>
        <Events />
      </div>
    );
  }
}

export default EventsPage;
