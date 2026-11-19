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
              key={record.libraryId}
              to={UrlJoin("/content", record.libraryId)}
              className={S("table-item")}
            >
              <div className={S("table-item__icon")}><ImageIcon icon={LibraryIcon}/></div>
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
    <div className="page-container">
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
      <LibrariesTable />
    </div>
  );
});

export default ContentLibrariesPage;
