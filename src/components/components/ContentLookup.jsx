import React, {useState} from "react";
import {Action, onEnterPressed} from "elv-components-js";
import {observer} from "mobx-react";
import {libraryStore} from "../../stores";
import {Redirect} from "react-router";

const ContentLookup = observer(() => {
  const [ lookupRedirect, setLookupRedirect ] = useState("");
  const [ contentLookupId, setContentLookupId ] = useState("");

  const Lookup = async () => {
    let redirectPath =
      await libraryStore.LookupContent(contentLookupId);

    if(!redirectPath) { return; }

    setLookupRedirect(redirectPath);
  };

  const versionHash = contentLookupId.startsWith("hq__") ? contentLookupId : undefined;

  if(lookupRedirect) { return <Redirect to={{pathname: lookupRedirect, state: {versionHash}}}/>; }

  return (
    <div className="content-lookup-container">
      <input
        value={contentLookupId}
        onChange={event => setContentLookupId( event.target.value)}
        onKeyPress={onEnterPressed(Lookup)}
        placeholder="Find content by ID, version hash or address"
      />
      <Action onClick={Lookup}>
        Search
      </Action>
    </div>
  );
});

export default ContentLookup;
