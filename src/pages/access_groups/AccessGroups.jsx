import UrlJoin from "url-join";
import ActionsToolbar from "@/components/ActionsToolbar";
import {groupStore} from "@/stores";
import {observer} from "mobx-react";
import {CopyableField, Linkish, PageHeader} from "@/components/Components";
import DataTable from "@/components/DataTable";
import ImageIcon from "@/components/ImageIcon";
import {CreateModuleClassMatcher} from "@/utils/Helpers";

import AccessGroupIcon from "@/assets/icons/groups.svg";

const S = CreateModuleClassMatcher();

const AccessGroupsTable = observer(() => {
  return (
    <DataTable
      records={Object.values(groupStore.accessGroups)}
      totalRecords={groupStore.accessGroupsCount}
      Load={params => groupStore.ListAccessGroups({params})}
      columns={[
        {
          accessor: "name",
          sortable: true,
          render: record => (
            <Linkish
              to={UrlJoin("/access-groups", record.address)}
              className={S("table-item")}
            >
              <ImageIcon icon={AccessGroupIcon} className={S("table-item__icon")} />
              <div className={S("table-item__text")}>
                <div className={S("table-item__text-primary")}>
                  {record.name}
                </div>
                <CopyableField value={record.address} className={S("table-item__text-secondary")}>
                  {record.address}
                </CopyableField>
              </div>
            </Linkish>
          )
        }
      ]}
    />
  );
});

const AccessGroupsPage = observer(() => {
  return (
    <div className="page-container">
      <ActionsToolbar
        actions={[
          {
            label: "New Access Group",
            type: "link",
            path: "/access-groups/create"
          }
        ]}
      />

      <PageHeader header="Access Groups" />
      <AccessGroupsTable />
    </div>
  );
});

export default AccessGroupsPage;
