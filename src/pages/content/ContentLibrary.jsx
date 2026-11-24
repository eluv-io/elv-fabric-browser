import {useState} from "react";
import UrlJoin from "url-join";
import Path from "path";
import ClippedText from "@/components/ClippedText";

import {observer} from "mobx-react";
import JSONField from "@/components/JSONField";
import ActionsToolbar from "@/components/ActionsToolbar";

import {libraryStore, routeStore} from "@/stores";
import {CopyableField, Linkish, PageHeader, LabelledField} from "@/components/Components";
import {Tabs} from "@mantine/core";
import {useParams} from "wouter";

import RefreshIcon from "@/assets/icons/refresh.svg";
import ContentIcon from "@/assets/icons/content.svg";
import AsyncComponent from "@/components/AsyncComponent";
import DataTable from "@/components/DataTable";
import ImageIcon from "@/components/ImageIcon";
import {CreateModuleClassMatcher} from "@/utils/Helpers";

import VideoIcon from "@/assets/icons/video.svg";

const S = CreateModuleClassMatcher();

const Actions = observer(({Reload}) => {
  const [showCopyObjectModal, setShowCopyObjectModal] = useState(false);

  return (
    <ActionsToolbar
      iconActions={[
        {
          icon: RefreshIcon,
          label: "Refresh",
          onClick: Reload
        }
      ]}
      actions={[
        {
          label: "Back",
          type: "link",
          path: Path.dirname(routeStore.path),
          variant: "secondary"
        },
        {
          label: "Manage",
          type: "link",
          hidden: !(libraryStore.library.isOwner || libraryStore.library.isManager),
          path: UrlJoin(routeStore.path, "edit"),
        },
        {
          label: "Types",
          type: "link",
          hidden: !libraryStore.library.isOwner,
          path: UrlJoin(routeStore.path, "types")
        },
        {
          label: libraryStore.library.isContentSpaceLibrary ? "New Content Type" : "Create",
          type: "link",
          hidden: !libraryStore.library.canContribute,
          path: UrlJoin(routeStore.path, "create")
        },
        {
          label: "Create From Existing",
          type: "button",
          hidden: libraryStore.library.isContentSpaceLibrary || !(libraryStore.library.isManager && libraryStore.library.canContribute),
          onClick: () => setShowCopyObjectModal(true)
        }
      ]}
    />
  );
});

const LibraryInfo = observer(() => {
  const library = libraryStore.library;

  const description = <ClippedText className="object-description" text={library.description} />;
  const libraryObjectPath = UrlJoin(routeStore.path, library.libraryObjectId);

  const ownerText = library.ownerName ?
    <span>{library.ownerName}<span className="help-text">&nbsp;({library.owner})</span></span> :
    library.owner;

  const types = Object.values(libraryStore.library.types);

  return (
    <div>
      <LabelledField label="Name">
        { library.name }
      </LabelledField>

      <LabelledField label="Description" alignTop={true}>
        { description }
      </LabelledField>

      <br />

      <LabelledField label="Library ID">
        { libraryStore.libraryId }
      </LabelledField>

      <LabelledField label={"Library Object"}>
        <Linkish className="inline-link" to={libraryObjectPath}>
          { library.libraryObjectId }
        </Linkish>
      </LabelledField>

      <LabelledField label={"Contract Address"}>
        <Linkish className="inline-link" to={UrlJoin(libraryObjectPath, "contract")}>
          { library.contractAddress }
        </Linkish>
      </LabelledField>

      <LabelledField label="KMS ID">
        { library.kmsId }
      </LabelledField>

      <LabelledField label="Tenant ID">
        { library.tenantId }
      </LabelledField>

      <LabelledField label="Owner">
        { ownerText }
      </LabelledField>

      <LabelledField label="Content Objects" value={libraryStore.library.objectsCount} />

      <br />

      {
        types.length === 0 ? null :
          <>
            <LabelledField label="Content Types" alignTop={true}>
              <div className={S("inline")}>
                {
                  types.map((type, index) =>
                    <>
                      <Linkish
                        key={`library-content-type-${type.id}`}
                        className={S("inline-link")}
                        to={UrlJoin("/content-types", type.id)}
                      >
                        {type.meta.name || type.id}
                      </Linkish>
                      {
                        index >= types.length - 1 ? null :
                          <div>,&nbsp;</div>
                      }
                    </>
                  )
                }
              </div>
            </LabelledField>
            <br />
          </>
      }

      <LabelledField label="Metadata" />

      <JSONField
        json={{
          ...(library.privateMeta || {}),
          public: library.publicMeta || {},
        }}
      />
    </div>
  );
});

const LibraryContent = observer(() => {
  const {libraryId} = useParams();

  const records = Object.values(libraryStore.library.objects || {});
  return (
    <DataTable
      totalRecords={libraryStore.library.objectsCount}
      records={records}
      Load={async (params) => await libraryStore.ListContentObjects({libraryId, params})}
      columns={[
        {
          accessor: "name",
          sortable: true,
          render: record => (
            <Linkish
              to={UrlJoin("/content", libraryId, record.id)}
              className={S("table-item")}
            >
              <div className={S("table-item__icon")}>
                <ImageIcon icon={record.isVideo ? VideoIcon : ContentIcon}/>
              </div>
              <div className={S("table-item__text")}>
                <div className={S("table-item__text-primary")}>
                  {record.name || record.id}
                </div>
                <CopyableField value={record.id} className={S("table-item__text-secondary")}>
                  {record.id}
                </CopyableField>
              </div>
            </Linkish>
          )
        },
        {
          accessor: "duration",
          hidden: !records.find(record => record.isVideo),
          width: 150,
          render: record => (
            <div className={S("table-item")}>
              {
                !record.isVideo ? null :
                  <>
                    <div className={S("table-item__text")}>
                      {
                        record.isLive ?
                          <div className={S("table-item__live-indicator")}>
                            LIVE
                          </div> :
                          <div className={S("table-item__text-secondary")}>
                            {record.duration}
                          </div>
                      }
                    </div>
                  </>
              }
            </div>
          )
        },
        {
          accessor: "lastModified",
          width: 150
        },
      ]}
    />
  );
});

const PageContent = observer(({Reload}) => {
  const {libraryId} = useParams();
  const [tab, setTab] = useState("content");

  if(!libraryStore.library) { return; }

  return (
    <div className="page-container">
      <Actions Reload={Reload} />
      <PageHeader
        header={libraryStore.library.name}
        subHeader={<CopyableField value={libraryId}>{libraryId}</CopyableField>}
      />
      <Tabs my="md" value={tab} onChange={setTab}>
        <Tabs.List>
          <Tabs.Tab value="content">Content</Tabs.Tab>
          <Tabs.Tab value="library">Library Info</Tabs.Tab>
          <Tabs.Tab value="groups">Access Groups</Tabs.Tab>
        </Tabs.List>
      </Tabs>
      {
        tab === "content" ?
          <LibraryContent /> :
          <LibraryInfo />
      }
    </div>
  );
});

const ContentLibraryPage = observer(() => {
  const {libraryId} = useParams();
  const [reloadKey, setReloadKey] = useState(Math.random());

  return (
    <AsyncComponent
      key={`page-${reloadKey}-${Math.random()}`}
      Load={async () => await libraryStore.ContentLibrary({libraryId})}
      render={() =>
        <PageContent
          Reload={() => {
            libraryStore.ClearLibraryCache({libraryId});
            setReloadKey(reloadKey + 1);
          }}
        />
      }
    />
  );
});

export default ContentLibraryPage;
