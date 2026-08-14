import "../leave_type/leave_types.css";
import "../common/filter.css";
import { axiosInstance } from "../axios";
import BreadCrumb from "../breadcrumb/Breadcrumb";
import Table from "../table/Table";
import Modal from "../common/modal/Modal";
import Alert, { type AlertProps } from "../common/alert/Alert";
import LabelAsterisk from "../common/LabelAsterisk";
import {
  getActiveLeaveTypes,
  type ActiveLeaveType,
} from "../services/leavetypesService";
import {
  patchCancelLeaveRequest,
  putLeaveRequest,
  getMyLeaveRequests,
  type LeaveRequest,
} from "../services/leaveRequestsService";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";

type EditLeaveFormData = {
  leave_type: string;
  start_date: string;
  end_date: string;
  attachment: FileList;
  reason: string;
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

const STATUS_OPTIONS = [
  "Pending",
  "Accepted",
  "Rejected",
  "Cancelled",
] as const;

const formatDateInputValue = (year: number, month: number, day: number) => {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
};

const getFiscalYearDateBounds = (today = new Date()) => {
  const year = today.getFullYear();
  const month = today.getMonth() + 1;

  if (month <= 3) {
    return {
      minDate: formatDateInputValue(year - 1, 4, 1),
      maxDate: formatDateInputValue(year, 3, 31),
    };
  }

  return {
    minDate: formatDateInputValue(year, 4, 1),
    maxDate: formatDateInputValue(year + 1, 3, 31),
  };
};

const ALLOWED_ATTACHMENT_EXTENSIONS = ["pdf", "jpg", "jpeg", "png"] as const;
const ATTACHMENT_ACCEPT = ".pdf,.jpg,.jpeg,.png";

const isAllowedAttachment = (file: File) => {
  const extension = file.name.split(".").pop()?.toLowerCase();
  return Boolean(
    extension &&
      ALLOWED_ATTACHMENT_EXTENSIONS.includes(
        extension as (typeof ALLOWED_ATTACHMENT_EXTENSIONS)[number]
      )
  );
};

const getAttachmentFileName = (attachment: string) => {
  try {
    const url = new URL(attachment, window.location.origin);
    return decodeURIComponent(url.pathname.split("/").pop() || "attachment");
  } catch {
    return attachment.split("/").pop() || "attachment";
  }
};

const toggleSetValue = <T,>(set: Set<T>, value: T) => {
  const next = new Set(set);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }
  return next;
};

const MyLeaves = () => {
  const {
    register: editRegister,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    watch: watchEdit,
    trigger: triggerEdit,
    setValue: setValueEdit,
    formState: editFormState,
  } = useForm<EditLeaveFormData>();

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [activeLeaveTypes, setActiveLeaveTypes] = useState<ActiveLeaveType[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [alertProps, setAlertProps] = useState<AlertProps | null>(null);
  const [alertKey, setAlertKey] = useState(0);
  const [editingRequestId, setEditingRequestId] = useState<number | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [existingAttachmentUrl, setExistingAttachmentUrl] = useState<
    string | null
  >(null);
  const [isExistingAttachmentCleared, setIsExistingAttachmentCleared] =
    useState(false);
  const [selectedLeaveTypes, setSelectedLeaveTypes] = useState<Set<string>>(
    new Set()
  );
  const [selectedMonths, setSelectedMonths] = useState<Set<number>>(new Set());
  const [selectedYears, setSelectedYears] = useState<Set<number>>(new Set());
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(
    new Set()
  );

  const { minDate, maxDate } = getFiscalYearDateBounds();
  const editLeaveTypeId = watchEdit("leave_type");
  const editStartDate = watchEdit("start_date");
  const editAttachment = watchEdit("attachment");
  const selectedEditLeaveType = activeLeaveTypes.find(
    (leaveType) => String(leaveType.id) === editLeaveTypeId
  );
  const hasAttachment = Boolean(
    editAttachment?.length ||
      (existingAttachmentUrl && !isExistingAttachmentCleared)
  );
  const requiresAttachment =
    (selectedEditLeaveType?.requires_attachment ?? false) && !hasAttachment;
  const endDateMin =
    editStartDate && editStartDate > minDate ? editStartDate : minDate;

  const columns = [
    { column: "Leave Type", sorting: true, type: "string", searching: true },
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
      const response = await getMyLeaveRequests();
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

  useEffect(() => {
    const fetchActiveLeaveTypes = async () => {
      try {
        const response = await getActiveLeaveTypes();
        setActiveLeaveTypes(response.data.leave_types);
      } catch (error) {
        showAlert({
          type: "danger",
          text:
            error instanceof Error ? error.message : "Something went wrong.",
        });
      }
    };

    fetchActiveLeaveTypes();
  }, []);

  useEffect(() => {
    triggerEdit("attachment");
  }, [requiresAttachment, triggerEdit]);

  useEffect(() => {
    triggerEdit("end_date");
  }, [editStartDate, triggerEdit]);

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
    setIsCancelling(false);
    setExistingAttachmentUrl(null);
    setIsExistingAttachmentCleared(false);
    resetEdit();
  };

  const handleEditClick = (requestId: number) => {
    const request = leaveRequests.find((item) => item.id === requestId);
    if (!request) return;

    if (request.status === "Pending") {
      const leaveType = activeLeaveTypes.find(
        (item) => item.name === request.leave_type
      );

      setExistingAttachmentUrl(request.attachment);
      setIsExistingAttachmentCleared(false);
      resetEdit({
        leave_type: leaveType ? String(leaveType.id) : "",
        start_date: request.start_date,
        end_date: request.end_date,
        reason: request.reason ?? "",
      });
      triggerEdit();
    }

    setEditingRequestId(request.id);
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

  const handleClearExistingAttachment = () => {
    setIsExistingAttachmentCleared(true);
    setValueEdit("attachment", undefined as unknown as FileList, {
      shouldValidate: true,
    });
  };

  const handleAttachmentChange = (
    event: ChangeEvent<HTMLInputElement>,
    onChange: (event: ChangeEvent<HTMLInputElement>) => void
  ) => {
    const file = event.target.files?.[0];
    if (file && !isAllowedAttachment(file)) {
      event.target.value = "";
      setValueEdit("attachment", undefined as unknown as FileList, {
        shouldValidate: true,
      });
      showAlert({
        type: "danger",
        text: "Only PDF, JPG, JPEG, and PNG files are allowed.",
      });
      return;
    }

    if (file) {
      setIsExistingAttachmentCleared(true);
    }

    onChange(event);
  };

  const attachmentRegister = editRegister("attachment", {
    validate: (files) => {
      if (!requiresAttachment) return true;
      return Boolean(files && files.length > 0);
    },
  });

  const handleUpdateLeave = async (data: EditLeaveFormData) => {
    if (editingRequestId === null) return;

    if (
      requiresAttachment &&
      (!data.attachment || data.attachment.length === 0)
    ) {
      showAlert({
        type: "danger",
        text: "Document is required for this leave type.",
      });
      return;
    }

    if (data.attachment?.[0] && !isAllowedAttachment(data.attachment[0])) {
      showAlert({
        type: "danger",
        text: "Only PDF, JPG, JPEG, and PNG files are allowed.",
      });
      return;
    }

    const formData = new FormData();
    formData.append("leave_type", data.leave_type);
    formData.append("start_date", data.start_date);
    formData.append("end_date", data.end_date);

    const trimmedReason = data.reason?.trim();
    if (trimmedReason) {
      formData.append("reason", trimmedReason);
    }

    if (data.attachment?.[0]) {
      formData.append("attachment", data.attachment[0]);
    } else if (existingAttachmentUrl && !isExistingAttachmentCleared) {
      const response = await fetch(existingAttachmentUrl, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Could not load the existing attachment.");
      }

      const blob = await response.blob();
      formData.append(
        "attachment",
        new File([blob], getAttachmentFileName(existingAttachmentUrl), {
          type: blob.type || "application/octet-stream",
        })
      );
    }

    try {
      const response = await putLeaveRequest(editingRequestId, formData);
      setLeaveRequests((prev) =>
        prev.map((request) =>
          request.id === editingRequestId
            ? response.data.leave_request
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

  const handleCancelRequest = async () => {
    if (editingRequestId === null) return;

    setIsCancelling(true);
    try {
      const response = await patchCancelLeaveRequest(editingRequestId);
      setLeaveRequests((prev) =>
        prev.map((request) =>
          request.id === editingRequestId
            ? response.data.leave_request
            : request
        )
      );
      closeEditModal();
      showAlert({
        type: "success",
        text: "Leave request cancelled successfully.",
      });
    } catch (error) {
      showAlert({
        type: "danger",
        text: error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsCancelling(false);
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

      <BreadCrumb title="Applied Leaves" path="My Leaves" />

      <Table
        header="My Leaves"
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
      >
        {isViewMode ? (
          <div className="leave_form">
            <div className="fields_container">
              <div className="field_container">
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
            </div>

            <div className="btn_container">
              <button
                className="cancel_button"
                type="button"
                onClick={closeEditModal}
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form
            className="leave_form"
            onSubmit={handleSubmitEdit(handleUpdateLeave)}
          >
            <div className="fields_container">
              <div className="field_container">
                <label htmlFor="edit-leave_type">
                  Leave Type <LabelAsterisk />
                </label>
                <select
                  id="edit-leave_type"
                  {...editRegister("leave_type", { required: true })}
                >
                  <option value="">Select leave type</option>
                  {activeLeaveTypes.map((leaveType) => (
                    <option key={leaveType.id} value={leaveType.id}>
                      {leaveType.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field_container">
                <label htmlFor="edit-start_date">
                  Start Date <LabelAsterisk />
                </label>
                <input
                  id="edit-start_date"
                  type="date"
                  min={minDate}
                  max={maxDate}
                  {...editRegister("start_date", {
                    required: true,
                    validate: (value) =>
                      Boolean(value) && value >= minDate && value <= maxDate,
                  })}
                />
              </div>
              <div className="field_container">
                <label htmlFor="edit-end_date">
                  End Date <LabelAsterisk />
                </label>
                <input
                  id="edit-end_date"
                  type="date"
                  min={endDateMin}
                  max={maxDate}
                  {...editRegister("end_date", {
                    required: true,
                    validate: (value) =>
                      Boolean(value) &&
                      value >= endDateMin &&
                      value <= maxDate &&
                      (!editStartDate || value >= editStartDate),
                  })}
                />
              </div>
              <div className="field_container">
                <label htmlFor="edit-attachment">
                  Upload Document {requiresAttachment && <LabelAsterisk />}
                </label>
                {existingAttachmentUrl && !isExistingAttachmentCleared && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginTop: "6px",
                    }}
                  >
                    <span style={{ fontSize: "14px" }}>
                      {getAttachmentFileName(existingAttachmentUrl)}
                    </span>
                    <button
                      type="button"
                      onClick={handleClearExistingAttachment}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#dc3545",
                        cursor: "pointer",
                        padding: 0,
                        fontSize: "14px",
                      }}
                    >
                      Clear
                    </button>
                  </div>
                )}
                <input
                  id="edit-attachment"
                  type="file"
                  accept={ATTACHMENT_ACCEPT}
                  style={{ background: "white", marginTop: "6px" }}
                  required={requiresAttachment}
                  {...attachmentRegister}
                  onChange={(event) =>
                    handleAttachmentChange(event, attachmentRegister.onChange)
                  }
                />
              </div>
              <div className="field_container">
                <label htmlFor="edit-reason">Reason</label>
                <textarea
                  id="edit-reason"
                  {...editRegister("reason")}
                  style={{ resize: "none" }}
                />
              </div>
            </div>

            <div className="btn_container">
              <button
                type="button"
                style={{ marginRight: "auto" }}
                className={`danger_btn ${isCancelling && "disabled"}`}
                onClick={handleCancelRequest}
                disabled={isCancelling || editFormState.isSubmitting}
              >
                {isCancelling ? "Cancelling..." : "Cancel Request"}
              </button>
              <button
                type="submit"
                className={`primary_btn ${
                  (!editFormState.isValid ||
                    editFormState.isSubmitting ||
                    isCancelling) &&
                  "disabled"
                }`}
                disabled={
                  !editFormState.isValid ||
                  editFormState.isSubmitting ||
                  isCancelling
                }
              >
                {editFormState.isSubmitting ? "Saving..." : "Save"}
              </button>
              <button
                className="cancel_button"
                type="button"
                onClick={closeEditModal}
                disabled={isCancelling || editFormState.isSubmitting}
              >
                Close
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
};

export default MyLeaves;
