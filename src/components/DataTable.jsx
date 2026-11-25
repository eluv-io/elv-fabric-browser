import DataTableStyles from "@/assets/stylesheets/modules/datatable.module.scss";

import {DataTable as MantineDataTable} from "mantine-datatable";
import {observer} from "mobx-react";
import {useEffect, useState} from "react";
import {CreateModuleClassMatcher, onEnterPressed} from "@/utils/Helpers";
import {TextInput} from "@mantine/core";
import ImageIcon from "@/components/ImageIcon";
import {IconButton} from "@/components/Components";

import SearchIcon from "@/assets/icons/search.svg";
import RefreshIcon from "@/assets/icons/refresh.svg";

const S = CreateModuleClassMatcher(DataTableStyles);

let loadTimeout, filterTimeout;
const DataTable = observer(({
  records=[],
  totalRecords,
  Load,
  Reload,
  defaultPerPage=10,
  minHeight,
  paginate=true,
  ...props
}) => {
  let defaultSortStatus;
  if(props.columns?.find(col => col.sortable)) {
    defaultSortStatus =  {
      columnAccessor: props.columns.find(col => col.sortable).accessor,
      direction: "asc"
    };
  }

  const [filter, setFilter] = useState("");
  const [filterInput, setFilterInput] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(!!Load);
  const [sortStatus, setSortStatus] = useState(defaultSortStatus);
  const [refreshKey, setRefreshKey] = useState(0);
  const [perPage, setPerPage] = useState(defaultPerPage);

  totalRecords = typeof totalRecords !== "undefined" ? totalRecords : (records || []).length;

  let pageParams;
  if(paginate) {
    pageParams = {
      totalRecords,
      page,
      recordsPerPage: perPage,
      onPageChange: setPage,
      recordsPerPageOptions: [10, 20, 50, 100],
      onRecordsPerPageChange: setPerPage
    };
  }

  useEffect(() => {
    clearTimeout(loadTimeout);

    if(!Load) { return; }

    loadTimeout = setTimeout(() => setLoading(true), 350);

    Load({
      page: paginate ? page : 1,
      perPage: paginate ? perPage : 10000,
      paginate,
      filter,
      sortBy: sortStatus?.columnAccessor,
      sortDirection: sortStatus?.direction
    })
      .finally(() => {
        clearTimeout(loadTimeout);
        setLoading(false);
      });
  }, [page, perPage, filter, sortStatus, refreshKey]);

  useEffect(() => {
    setPage(1);
  }, [filter, sortStatus]);

  useEffect(() => {
    clearTimeout(filterTimeout);

    filterTimeout = setTimeout(() => setFilter(filterInput), 1000);
  }, [filterInput]);

  return (
    <div className={S("table-view")}>
      {
        !Load ? null :
          <div className={S("filter-container")}>
            <TextInput
              w={400}
              leftSection={<ImageIcon icon={SearchIcon} className={S("input-icon")}/>}
              value={filterInput}
              placeholder="Filter"
              onChange={event => setFilterInput(event.target.value)}
              onKeyPress={
                onEnterPressed(() => {
                  clearTimeout(filterTimeout);
                  setFilter(filterInput);
                })
              }
            />
            <IconButton
              icon={RefreshIcon}
              size="sm"
              onClick={async () => {
                Reload && await Reload();

                setRefreshKey(refreshKey + 1);
                await new Promise(resolve => setTimeout(resolve, 1000));
              }}
            />
          </div>
      }
      <div className={S("table-container")}>
        <MantineDataTable
          withTableBorder
          fetching={loading}
          highlightOnHover
          highlightOnHoverColor="var(--background-hover)"
          sortStatus={sortStatus}
          onSortStatusChange={setSortStatus}
          {...props}
          {...pageParams}
          records={records}
          classNames={{
            root: S("table", paginate ? "table--paginated" : "", records.length === 0 ? "table--empty" : ""),
            header: S("header"),
            pagination: S("pagination"),
          }}
          minHeight={
            minHeight ||
            (
              records.length === 0 ?
                200 :
                paginate ? 120 : 0
            )
          }
        />
      </div>
    </div>
  );
});

export default DataTable;
