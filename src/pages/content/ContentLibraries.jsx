import UrlJoin from "url-join";
import ActionsToolbar from "@/components/ActionsToolbar";
import {libraryStore} from "@/stores";
import {observer} from "mobx-react";
import {CopyableField, Linkish, PageHeader} from "@/components/Components";
import DataTable from "@/components/DataTable";
import ImageIcon from "@/components/ImageIcon";
import {CreateModuleClassMatcher} from "@/utils/Helpers";

import LibraryIcon from "@/assets/icons/content.svg";

const S = CreateModuleClassMatcher();

const LibrariesTable = observer(() => {
  return (
    <DataTable
      records={Object.values(libraryStore.libraries)}
      totalRecords={libraryStore.count}
      Load={params => libraryStore.ListContentLibraries({params})}
      columns={[
        {
          accessor: "name",
          sortable: true,
          render: record => (
            <Linkish
              to={UrlJoin("/content", record.libraryId)}
              className={S("table-item")}
            >
              <ImageIcon icon={LibraryIcon} className={S("table-item__icon")} />
              <div className={S("table-item__text")}>
                <div className={S("table-item__text-primary")}>
                  {record.name}
                </div>
                <CopyableField value={record.libraryId} className={S("table-item__text-secondary")}>
                  {record.libraryId}
                </CopyableField>
              </div>
            </Linkish>
        )
      }
      ]}
    />
  );
});

const ContentLibrariesPage = observer(() => {
  return (
    <div className="page-container contents-page-container">
      <ActionsToolbar
        actions={[
          {
            label: "New Library",
            type: "link",
            path: UrlJoin("/content", "create")
          }
        ]}
      />

      <PageHeader header="Content Libraries" />

      <div className="page-content-container">
        <div className="page-content">
          <LibrariesTable />
        </div>
      </div>
    </div>
  );
});

export default ContentLibrariesPage;
