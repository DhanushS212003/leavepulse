import { useMemo, useState, type ReactNode } from "react";
import "./table.css";

type ColumnsProp = {
  column: string;
  sorting?: boolean;
  searching?: boolean;
  type?: string;
};

type Props = {
  header: string;
  columns: ColumnsProp[];
  data: string[][];
  rowIds?: (string | number)[];
  onEditClick?: (rowId: string | number) => void;
  hasFilters?: boolean;
  filterChild?: () => ReactNode;
  loading?: boolean;
};

const Table = ({
  header,
  columns = [],
  data = [],
  rowIds = [],
  onEditClick,
  hasFilters = false,
  filterChild,
  loading = false,
}: Props) => {
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    column: string | null;
    direction: "asc" | "desc";
  }>({
    column: null,
    direction: "asc",
  });

  const searchableColumnIndexes = useMemo(
    () =>
      columns.reduce<number[]>((indexes, columnConfig, index) => {
        if (columnConfig.searching) {
          indexes.push(index);
        }
        return indexes;
      }, []),
    [columns]
  );

  const filteredAndSortedRows = useMemo(() => {
    const rows = data.map((row, index) => ({
      row,
      rowId: rowIds[index],
    }));

    const normalizedQuery = searchQuery.trim().toLowerCase();
    const filteredRows =
      normalizedQuery && searchableColumnIndexes.length > 0
        ? rows.filter(({ row }) =>
            searchableColumnIndexes.some((columnIndex) =>
              String(row[columnIndex] ?? "")
                .toLowerCase()
                .includes(normalizedQuery)
            )
          )
        : rows;

    const { column, direction } = sortConfig;

    if (!column) return filteredRows;

    const columnConfig = columns.find((col) => col.column === column);
    if (!columnConfig || !columnConfig.sorting) return filteredRows;

    const columnIndex = columns.findIndex((col) => col.column === column);
    const sortType = columnConfig.type || "string";
    const directionMultiplier = direction === "asc" ? 1 : -1;

    const compareValues = (aValue: string, bValue: string) => {
      if (sortType === "date") {
        const aTime = aValue ? new Date(aValue).getTime() : 0;
        const bTime = bValue ? new Date(bValue).getTime() : 0;
        return (aTime - bTime) * directionMultiplier;
      }

      const aString = aValue ?? "";
      const bString = bValue ?? "";
      return (
        String(aString).localeCompare(String(bString), undefined, {
          sensitivity: "base",
          numeric: sortType === "number",
        }) * directionMultiplier
      );
    };

    return [...filteredRows].sort((rowA, rowB) =>
      compareValues(rowA.row?.[columnIndex], rowB.row?.[columnIndex])
    );
  }, [columns, data, rowIds, searchableColumnIndexes, searchQuery, sortConfig]);

  const handleSort = (columnName: string) => {
    setSortConfig((prev) => {
      if (prev.column === columnName) {
        return {
          column: columnName,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }

      return {
        column: columnName,
        direction: "asc",
      };
    });
  };

  return (
    <div className="table_section">
      <div className="table_header_container">
        <h3> {header} </h3>
        {searchableColumnIndexes.length > 0 && (
          <input
            type="search"
            placeholder="Search"
            className="search_bar"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        )}
        {hasFilters && (
          <button
            className="filter_btn"
            onClick={() => setShowFilters(!showFilters)}
          >
            <i
              className={`fa-solid ${
                showFilters ? "fa-chevron-up" : "fa-chevron-down"
              }`}
              style={{ color: "darkslategray", fontSize: "12px" }}
            />
            Filters
          </button>
        )}
      </div>

      {filterChild && showFilters && (
        <div className="filter_container">{filterChild()}</div>
      )}

      {columns.length > 0 && (
        <div className="table_container">
          <table className="table">
            <thead>
              <tr>
                <th>S.No</th>
                {columns.map((columnConfig, index) => (
                  <th key={index}>
                    {columnConfig.sorting ? (
                      <button
                        type="button"
                        className="table_header_btn"
                        onClick={() => handleSort(columnConfig.column)}
                      >
                        {columnConfig.column}
                        <i
                          className={`sort fa-solid ${
                            sortConfig.column === columnConfig.column
                              ? sortConfig.direction === "asc"
                                ? "fa-sort-up"
                                : "fa-sort-down"
                              : "fa-sort"
                          }`}
                          style={{ fontSize: "12px" }}
                        />
                      </button>
                    ) : (
                      columnConfig.column
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            {!loading && filteredAndSortedRows.length !== 0 && (
              <tbody>
                {filteredAndSortedRows.map(({ row, rowId }, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    {row.map((res, i) => (
                      <td key={i}>
                        {res === "Edit" || res === "View" ? (
                          <button
                            type="button"
                            className="edit_button"
                            onClick={() => {
                              if (rowId !== undefined) {
                                onEditClick?.(rowId);
                              }
                            }}
                          >
                            {res}
                          </button>
                        ) : (
                          res
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            )}
          </table>
          {(loading || filteredAndSortedRows.length === 0) && (
            <div className="table_message_container">
              {loading ? (
                <p>
                  <i
                    className="fa-solid fa-spinner fa-spin"
                    style={{ marginRight: "6px" }}
                  />
                  Loading...
                </p>
              ) : (
                filteredAndSortedRows.length === 0 && <p>No results found</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Table;
