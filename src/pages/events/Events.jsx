import Events from "@/components/Events";
import ActionsToolbar from "@/components/ActionsToolbar";
import {observer} from "mobx-react";

const EventsPage = observer(() => {
  return (
    <div className="page-container">
      <ActionsToolbar/>
      <div className="page-header-container">
        <h3 className="page-header">Blockchain Events</h3>
      </div>
      <Events/>
    </div>
  );
});

export default EventsPage;
