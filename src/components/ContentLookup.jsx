import CommonStyles from "@/assets/stylesheets/modules/common.module.scss";

import {useState} from "react";
import {observer} from "mobx-react";
import {libraryStore} from "@/stores";
import {Redirect} from "wouter";
import {Button} from "@/components/Components";
import {CreateModuleClassMatcher, onEnterPressed} from "@/utils/Helpers";
import {TextInput} from "@mantine/core";
import ImageIcon from "@/components/ImageIcon";

import SearchIcon from "@/assets/icons/search.svg";

const S = CreateModuleClassMatcher(CommonStyles);

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
    <div className={S("content-lookup")}>
      <TextInput
        value={contentLookupId}
        onChange={event => setContentLookupId( event.target.value)}
        onKeyPress={onEnterPressed(Lookup)}
        leftSection={<ImageIcon icon={SearchIcon} className={S("input-icon")}/>}
        placeholder="Find content by ID, version hash or address"
        className={S("content-lookup__input")}
      />
      <Button onClick={Lookup}>
        Search
      </Button>
    </div>
  );
});

export default ContentLookup;
