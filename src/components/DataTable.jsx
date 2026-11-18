import DataTableStyles from "@/assets/stylesheets/modules/datatable.module.scss";

import {DataTable as MantineDataTable} from "mantine-datatable";
import {observer} from "mobx-react";
import {useState} from "react";
import {CreateModuleClassMatcher} from "@/utils/Helpers";

const S = CreateModuleClassMatcher(DataTableStyles);

const DataTable = observer((props) => {
  const [page, setPage] = useState(1);
  const perPage = props.perPage || 10;

  const totalRecords = (props.records || []).length;
  const records = (props.records || []).slice((page - 1) * perPage, page * perPage);

  let pageParams = {};
  if(totalRecords > perPage) {
    pageParams = {
      totalRecords,
      page,
      recordsPerPage: perPage,
      onPageChange: setPage
    };
  }

  return (
    <MantineDataTable
      withTableBorder
      {...props}
      {...pageParams}
      records={records}
      classNames={{
        root: S("table"),
        header: S("header")
      }}
      minHeight={props.minHeight || (props.records || []).length === 0 ? 150 : undefined}
    />
  );
});

export default DataTable;
