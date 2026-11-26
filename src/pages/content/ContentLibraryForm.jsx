import {observer} from "mobx-react";
import {useEffect, useState} from "react";
import {libraryStore} from "@/stores";
import Form from "@/components/Form";
import JSONEditField from "@/components/JSONEditField";
import {TextInput} from "@mantine/core";
import UrlJoin from "url-join";
import {useLocation} from "wouter";

const ContentLibraryForm = observer(() => {
  const [, navigate] = useLocation();
  const [metadata, setMetadata] = useState(undefined);
  const [metadataValid, setMetadataValid] = useState(true);

  const [formData, setFormData] = useState({
    name: "New Library",
    tenantId: "",
    kmsId: ""
  });

  useEffect(() => {
    (async () => {
      if(libraryStore.libraryId) {
        await libraryStore.ContentLibrary({libraryId: libraryStore.libraryId});
        const library = libraryStore.libraries[libraryStore.libraryId];

        setMetadata(JSON.stringify(library.metadata, null, 2));
        setFormData({
          name: library.name,
          kmsId: library.kmsId,
          tenantId: library.tenantId,
        });
      } else {
        const kmsId = await libraryStore.DefaultKMSId() || "";
        const tenantId = await libraryStore.DefaultTenantId() || "";

        setFormData({
          ...formData,
          kmsId,
          tenantId
        });
        setMetadata("{}");
      }
    })();
  }, [libraryStore.libraryId]);

  useEffect(() => {
    if(typeof metadata === "undefined") { return; }

    try {
      JSON.parse(metadata);
      setMetadataValid(true);
    } catch(error) {
      setMetadataValid(false);
    }
  }, [metadata]);

  return (
    <Form
      legend={libraryStore.libraryId ? "Update Content Library" : "Create Content Library"}
      disabled={!metadataValid || !formData.name}
      showTopControls
      showBottomControls={false}
      loading={typeof metadata === "undefined"}
      cancelPath={
        libraryStore.libraryId ?
          UrlJoin("/content", libraryStore.libraryId) :
          "/content"
      }
      onSubmit={async () => {
        let libraryId;
        if(libraryStore.libraryId) {
          libraryId = await libraryStore.UpdateContentLibrary({
            libraryId: libraryStore.libraryId,
            name: formData.name,
            metadata
          });
        } else {
          libraryId = await libraryStore.CreateContentLibrary({
            name: formData.name,
            tenantId: formData.tenantId,
            kmsId: formData.kmsId,
            metadata
          });
        }

        navigate(UrlJoin("/content", libraryId));
      }}
    >
      <TextInput
        label="Name"
        required
        placeholder="Library Name..."
        value={formData.name}
        onChange={event => setFormData({...formData, name: event.target.value})}
      />
      {
        libraryStore.libraryId ? null :
          <>
            <TextInput
              label="Tenant ID"
              placeholder="Tenant Id..."
              value={formData.tenantId}
              onChange={event => setFormData({...formData, tenantId: event.target.value})}
            />
            <TextInput
              label="KMS Id"
              placeholder="KMS ID..."
              value={formData.kmsId}
              onChange={event => setFormData({...formData, kmsId: event.target.value})}
            />
          </>
      }
      <JSONEditField
        label="Metadata"
        value={metadata}
        h={libraryStore.libraryId ? 600 : 450}
        onChange={setMetadata}
      />
    </Form>
  );
});

export default ContentLibraryForm;
