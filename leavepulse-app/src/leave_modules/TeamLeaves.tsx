import "../leave_type/leave_types.css";
import "../common/filter.css";
import { axiosInstance } from "../axios";
import BreadCrumb from "../breadcrumb/Breadcrumb";
import Table from "../table/Table";
import Modal from "../common/modal/Modal";
import Alert, { type AlertProps } from "../common/alert/Alert";
import {
  getTeamLeaveRequests,
  patchTeamLeaveRequest,
  type LeaveRequest,
} from "../services/leaveRequestsService";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

type EditLeaveFormData = {
  status: "PENDING" | "APPROVED" | "REJECTED";
  remark: string;
};

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const STATUS_OPTIONS = ["Pending", "Approved", "Rejected"] as const;

const toggleSetValue = <T,>(set: Set<T>, value: T) => {
  const next = new Set(set);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }
  return next;
};

const STATUS_LABEL_TO_API = {
  Pending: "PENDING",
  Approved: "APPROVED",
  Rejected: "REJECTED",
} as const;

const STATUS_API_TO_LABEL = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
} as const;

const STATUS_EDIT_OPTIONS: Array<{
  label: "Pending" | "Approved" | "Rejected";
  value: "PENDING" | "APPROVED" | "REJECTED";
}> = [
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
];

const getAttachmentFileName = (attachment: string) => {
  try {
    const url = new URL(attachment, window.location.origin);
    return decodeURIComponent(url.pathname.split("/").pop() || "attachment");
  } catch {
    return attachment.split("/").pop() || "attachment";
  }
};

const TeamLeaves = () => {
  const {
    register: editRegister,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: editFormState,
  } = useForm<EditLeaveFormData>();

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [alertProps, setAlertProps] = useState<AlertProps | null>(null);
  const [alertKey, setAlertKey] = useState(0);
  const [editingRequestId, setEditingRequestId] = useState<number | null>(null);
  const [selectedLeaveTypes, setSelectedLeaveTypes] = useState<Set<string>>(
    new Set()
  );
  const [selectedMonths, setSelectedMonths] = useState<Set<number>>(new Set());
  const [selectedYears, setSelectedYears] = useState<Set<number>>(new Set());
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(
    new Set()
  );

  const columns = [
    { column: "Leave Type", sorting: true, type: "string", searching: true },
    { column: "Employee", sorting: true, type: "string", searching: true },
    { column: "Start Date", sorting: true, type: "date", searching: true },
    { column: "End Date", sorting: true, type: "date", searching: true },
    { column: "Days", sorting: true, type: "number", searching: true },
    { column: "Status", sorting: true, type: "string" },
    { column: "Action" },
  ];

  const showAlert = (props: AlertProps) => {
    setAlertProps(props);
    setAlertKey((key) => key + 1);
  };

  const fetchLeaveRequests = async () => {
    setIsLoading(true);
    try {
      const response = await getTeamLeaveRequests();
      setLeaveRequests(response.data.leave_requests);
    } catch (error) {
      showAlert({
        type: "danger",
        text: error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const uniqueLeaveTypes = useMemo(
    () =>
      [...new Set(leaveRequests.map((request) => request.leave_type))].sort(),
    [leaveRequests]
  );

  const uniqueMonths = useMemo(
    () =>
      [
        ...new Set(
          leaveRequests.map(
            (request) => new Date(request.start_date).getMonth() + 1
          )
        ),
      ].sort((a, b) => a - b),
    [leaveRequests]
  );

  const uniqueYears = useMemo(
    () =>
      [
        ...new Set(
          leaveRequests.map((request) =>
            new Date(request.start_date).getFullYear()
          )
        ),
      ].sort((a, b) => a - b),
    [leaveRequests]
  );

  const filteredLeaveRequests = useMemo(() => {
    return leaveRequests.filter((request) => {
      const requestMonth = new Date(request.start_date).getMonth() + 1;
      const requestYear = new Date(request.start_date).getFullYear();

      const matchesLeaveType =
        selectedLeaveTypes.size === 0 ||
        selectedLeaveTypes.has(request.leave_type);
      const matchesMonth =
        selectedMonths.size === 0 || selectedMonths.has(requestMonth);
      const matchesYear =
        selectedYears.size === 0 || selectedYears.has(requestYear);
      const matchesStatus =
        selectedStatuses.size === 0 || selectedStatuses.has(request.status);

      return matchesLeaveType && matchesMonth && matchesYear && matchesStatus;
    });
  }, [
    leaveRequests,
    selectedLeaveTypes,
    selectedMonths,
    selectedYears,
    selectedStatuses,
  ]);

  const tableData = filteredLeaveRequests.map((request) => [
    request.leave_type,
    request.employee_name ?? "-",
    request.start_date,
    request.end_date,
    String(request.days),
    request.status,
    request.status === "Pending" ? "Edit" : "View",
  ]);

  const rowIds = filteredLeaveRequests.map((request) => request.id);
  const editingRequest =
    editingRequestId === null
      ? null
      : leaveRequests.find((request) => request.id === editingRequestId) ??
        null;
  const isViewMode =
    editingRequest !== null && editingRequest.status !== "Pending";

  const clearFilters = () => {
    setSelectedLeaveTypes(new Set());
    setSelectedMonths(new Set());
    setSelectedYears(new Set());
    setSelectedStatuses(new Set());
  };

  const closeEditModal = () => {
    setEditingRequestId(null);
    resetEdit();
  };

  const handleEditClick = (requestId: number) => {
    const request = leaveRequests.find((item) => item.id === requestId);
    if (!request) return;
    if (request.status === "Pending") {
      resetEdit({
        status: STATUS_LABEL_TO_API[request.status],
        remark: request.remark ?? "",
      });
    }
    setEditingRequestId(request.id);
  };

  const handleUpdateLeave = async (data: EditLeaveFormData) => {
    if (editingRequestId === null) return;

    try {
      const response = await patchTeamLeaveRequest(editingRequestId, {
        status: data.status,
        remark: data.remark.trim(),
      });

      const normalizedStatus =
        STATUS_API_TO_LABEL[data.status] ?? response.data.leave_request.status;
      setLeaveRequests((prev) =>
        prev.map((request) =>
          request.id === editingRequestId
            ? {
                ...response.data.leave_request,
                status: normalizedStatus,
                remark: data.remark.trim(),
              }
            : request
        )
      );
      closeEditModal();
      showAlert({
        type: "success",
        text: "Leave request updated successfully.",
      });
    } catch (error) {
      showAlert({
        type: "danger",
        text: error instanceof Error ? error.message : "Something went wrong.",
      });
    }
  };

  const handleDownloadAttachment = async (attachmentUrl: string) => {
    try {
      const baseUrl = axiosInstance.defaults.baseURL ?? window.location.origin;
      const backendOrigin = new URL(baseUrl, window.location.origin).origin;
      const resolvedAttachmentUrl = /^https?:\/\//i.test(attachmentUrl)
        ? attachmentUrl
        : new URL(attachmentUrl, backendOrigin).toString();

      const response = await axiosInstance.get<Blob>(resolvedAttachmentUrl, {
        responseType: "blob",
      });

      const objectUrl = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = getAttachmentFileName(attachmentUrl);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (error) {
      showAlert({
        type: "danger",
        text: error instanceof Error ? error.message : "Something went wrong.",
      });
    }
  };

  const getFilterChild = () => {
    return (
      <div className="filter_panel">
        <div className="filter_groups">
          <div className="filter_group">
            <h3 className="filter_heading">Leave Types</h3>
            {uniqueLeaveTypes.map((leaveType) => (
              <label key={leaveType} className="filter_option">
                <input
                  type="checkbox"
                  checked={selectedLeaveTypes.has(leaveType)}
                  onChange={() =>
                    setSelectedLeaveTypes((prev) =>
                      toggleSetValue(prev, leaveType)
                    )
                  }
                />
                {leaveType}
              </label>
            ))}
          </div>

          <div className="filter_group">
            <h3 className="filter_heading">Month</h3>
            {uniqueMonths.map((month) => (
              <label key={month} className="filter_option">
                <input
                  type="checkbox"
                  checked={selectedMonths.has(month)}
                  onChange={() =>
                    setSelectedMonths((prev) => toggleSetValue(prev, month))
                  }
                />
                {MONTH_LABELS[month - 1]}
              </label>
            ))}
          </div>

          <div className="filter_group">
            <h3 className="filter_heading">Year</h3>
            {uniqueYears.map((year) => (
              <label key={year} className="filter_option">
                <input
                  type="checkbox"
                  checked={selectedYears.has(year)}
                  onChange={() =>
                    setSelectedYears((prev) => toggleSetValue(prev, year))
                  }
                />
                {year}
              </label>
            ))}
          </div>

          <div className="filter_group">
            <h3 className="filter_heading">Status</h3>
            {STATUS_OPTIONS.map((status) => (
              <label key={status} className="filter_option">
                <input
                  type="checkbox"
                  checked={selectedStatuses.has(status)}
                  onChange={() =>
                    setSelectedStatuses((prev) => toggleSetValue(prev, status))
                  }
                />
                {status}
              </label>
            ))}
          </div>
        </div>

        <div className="filter_footer">
          <button
            type="button"
            className="clear_filters_btn"
            onClick={clearFilters}
          >
            <i className="fa-solid fa-xmark" />
            Clear Filters
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {alertProps && <Alert key={alertKey} {...alertProps} />}

      <BreadCrumb title="Team Member's Leaves" path="Team Leaves" />

      <Table
        header="Team Leaves"
        columns={columns}
        data={tableData}
        rowIds={rowIds}
        onEditClick={(id) => handleEditClick(Number(id))}
        hasFilters={true}
        filterChild={getFilterChild}
        loading={isLoading}
      />

      <Modal
        isOpen={editingRequestId !== null}
        onClose={closeEditModal}
        title={isViewMode ? "View Leave Request" : "Edit Leave Request"}
        width={isViewMode ? 500 : 700}
      >
        <form
          className="leave_form"
          onSubmit={handleSubmitEdit(handleUpdateLeave)}
        >
          <div
            className="fields_container"
            style={{
              display: "grid",
              gridTemplateColumns: isViewMode ? "1fr" : "1.5fr 1.2fr",
              alignItems: "start",
              gap: 0,
            }}
          >
            <div
              className="field_container"
              style={
                isViewMode
                  ? undefined
                  : { borderRight: "1px solid #d9d9d9", paddingRight: "16px" }
              }
            >
              <h3 style={{ marginBottom: "16px", fontSize: "18px" }}>
                Request Information
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "max-content 1fr",
                  gap: "10px 16px",
                  alignItems: "start",
                }}
              >
                <strong>Leave Type:</strong>
                <span>{editingRequest?.leave_type ?? "-"}</span>
                <strong>Employee:</strong>
                <span>{editingRequest?.employee_name ?? "-"}</span>
                <strong>Employee Code:</strong>
                <span>{editingRequest?.employee_code ?? "-"}</span>
                <strong>Start Date:</strong>
                <span>{editingRequest?.start_date ?? "-"}</span>
                <strong>End Date:</strong>
                <span>{editingRequest?.end_date ?? "-"}</span>
                <strong>Days:</strong>
                <span>{editingRequest?.days ?? "-"}</span>
                <strong>Status:</strong>
                <span>{editingRequest?.status ?? "-"}</span>
                <strong>Attachment:</strong>
                <span>
                  {editingRequest?.attachment ? (
                    <button
                      type="button"
                      onClick={() =>
                        handleDownloadAttachment(
                          editingRequest.attachment as string
                        )
                      }
                      style={{
                        padding: 0,
                        border: "none",
                        background: "none",
                        color: "#0d6efd",
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      Download
                    </button>
                  ) : (
                    "-"
                  )}
                </span>
                <strong>Reason:</strong>
                <span>{editingRequest?.reason || "-"}</span>
                <strong>Applied At:</strong>
                <span>{editingRequest?.applied_at ?? "-"}</span>
                {(editingRequest?.status === "Approved" ||
                  editingRequest?.status === "Rejected") && (
                  <>
                    <strong>Actioned At:</strong>
                    <span>{editingRequest?.actioned_at ?? "-"}</span>
                    <strong>Remark:</strong>
                    <span>{editingRequest?.remark || "-"}</span>
                  </>
                )}
              </div>
            </div>
            {!isViewMode && (
              <div className="field_container" style={{ paddingLeft: "24px" }}>
                <h3 style={{ marginBottom: "16px", fontSize: "18px" }}>
                  Update Request
                </h3>
                <label htmlFor="edit-status">Status</label>
                <select
                  id="edit-status"
                  {...editRegister("status", { required: true })}
                >
                  {STATUS_EDIT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <label htmlFor="edit-remark" style={{ marginTop: "10px" }}>
                  Remark
                </label>
                <textarea
                  id="edit-remark"
                  {...editRegister("remark")}
                  style={{ resize: "none" }}
                />
              </div>
            )}
          </div>

          <div className="btn_container">
            {!isViewMode && (
              <button
                type="submit"
                className={`primary_btn ${
                  (!editFormState.isValid || editFormState.isSubmitting) &&
                  "disabled"
                }`}
                disabled={!editFormState.isValid || editFormState.isSubmitting}
              >
                {editFormState.isSubmitting ? "Saving..." : "Save"}
              </button>
            )}
            <button
              className="cancel_button"
              type="button"
              onClick={closeEditModal}
              disabled={editFormState.isSubmitting}
            >
              Close
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default TeamLeaves;
