import UrlJoin from "url-join";
import ActionsToolbar from "@/components/ActionsToolbar";
import {typeStore} from "@/stores";
import {observer} from "mobx-react";
import {CopyableField, Linkish, PageHeader} from "@/components/Components";
import DataTable from "@/components/DataTable";
import ImageIcon from "@/components/ImageIcon";
import {CreateModuleClassMatcher} from "@/utils/Helpers";

import TypeIcon from "@/assets/icons/content.svg";

const S = CreateModuleClassMatcher();

const ContentTypesTable = observer(() => {
  return (
    <DataTable
      records={Object.values(typeStore.types)}
      totalRecords={typeStore.count}
      Load={params => typeStore.ListContentTypes({params})}
      columns={[
        {
          accessor: "name",
          sortable: true,
          render: record => (
            <Linkish
              to={UrlJoin("/content-types", record.id)}
              className={S("table-item")}
            >
              <ImageIcon icon={TypeIcon} className={S("table-item__icon")} />
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
      }
      ]}
    />
  );
});

const ContentTypesPage = observer(() => {
  return (
    <div className="page-container contents-page-container">
      <ActionsToolbar
        actions={[
          {
            label: "New Content Type",
            type: "link",
            path: "/content-types/create"
          }
        ]}
      />

      <PageHeader header="Content Types" />

      <div className="page-content-container">
        <div className="page-content">
          <ContentTypesTable />
        </div>
      </div>
    </div>
  );
});

export default ContentTypesPage;
