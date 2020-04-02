import React from "react";
import Events from "../../components/Events";

class EventsPage extends React.Component {
  render() {
    return (
      <div className="page-container">
        <div className="page-header-container">
          <h3 className="page-header">Blockchain Events</h3>
        </div>
        <Events />
      </div>
    );
  }
}

export default EventsPage;
