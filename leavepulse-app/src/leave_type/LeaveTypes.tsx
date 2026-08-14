import "./leave_types.css";
import "../common/filter.css";
import BreadCrumb from "../breadcrumb/Breadcrumb";
import Table from "../table/Table";
import { useEffect, useState } from "react";
import {
  getLeaveTypes,
  patchLeaveTypes,
  postLeaveTypes,
  putLeaveTypes,
  type LeaveType,
} from "../services/leavetypesService";
import type { AlertProps } from "../common/alert/Alert";
import Alert from "../common/alert/Alert";
import Modal from "../common/modal/Modal";
import { useForm, type UseFormRegister } from "react-hook-form";
import LabelAsterisk from "../common/LabelAsterisk";

type LeaveFormData = {
  name: string;
  days: string;
  attachment_required: boolean;
};

type LeaveFilters = {
  days: { lte15: boolean; mid: boolean; gt30: boolean };
  attachment: { required: boolean; notRequired: boolean };
  status: { active: boolean; inactive: boolean };
};

const defaultLeaveFilters: LeaveFilters = {
  days: { lte15: false, mid: false, gt30: false },
  attachment: { required: false, notRequired: false },
  status: { active: true, inactive: false },
};

const renderLeaveFormFields = (
  register: UseFormRegister<LeaveFormData>,
  idPrefix = ""
) => (
  <div className="fields_container">
    <div className="field_container">
      <label htmlFor={`${idPrefix}name`}>
        Leave Name <LabelAsterisk />
      </label>
      <input
        id={`${idPrefix}name`}
        type="text"
        {...register("name", {
          required: true,
          validate: (value) => value.trim().length > 0,
        })}
      />
    </div>
    <div className="field_container">
      <label htmlFor={`${idPrefix}days`}>
        Days (per year) <LabelAsterisk />
      </label>
      <input
        id={`${idPrefix}days`}
        type="number"
        min={1}
        {...register("days", {
          required: true,
          validate: (value) =>
            value.trim().length > 0 && !Number.isNaN(Number(value)),
        })}
      />
    </div>
    <div className="attachment_container">
      <input
        id={`${idPrefix}attachment_required`}
        type="checkbox"
        {...register("attachment_required", {
          required: false,
        })}
      />
      <label htmlFor={`${idPrefix}attachment_required`}>
        Attachment Mandatory
      </label>
    </div>
  </div>
);

const matchesDaysFilters = (leave: LeaveType, days: LeaveFilters["days"]) => {
  const hasSelection = days.lte15 || days.mid || days.gt30;
  if (!hasSelection) return true;

  return (
    (days.lte15 && leave.days_per_year <= 15) ||
    (days.mid && leave.days_per_year >= 16 && leave.days_per_year <= 30) ||
    (days.gt30 && leave.days_per_year > 30)
  );
};

const matchesAttachmentFilters = (
  leave: LeaveType,
  attachment: LeaveFilters["attachment"]
) => {
  const hasSelection = attachment.required || attachment.notRequired;
  if (!hasSelection) return true;

  return (
    (attachment.required && leave.requires_attachment) ||
    (attachment.notRequired && !leave.requires_attachment)
  );
};

const matchesStatusFilters = (
  leave: LeaveType,
  status: LeaveFilters["status"]
) => {
  const hasSelection = status.active || status.inactive;
  if (!hasSelection) return false;

  return (
    (status.active && leave.is_active) || (status.inactive && !leave.is_active)
  );
};

const LeaveTypes = () => {
  const { register, handleSubmit, reset, formState } = useForm<LeaveFormData>();
  const {
    register: editRegister,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    trigger: triggerEdit,
    formState: editFormState,
  } = useForm<LeaveFormData>();
  const [alertProps, setAlertProps] = useState<AlertProps | null>(null);
  const [alertKey, setAlertKey] = useState(0);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [filters, setFilters] = useState<LeaveFilters>(defaultLeaveFilters);
  const [isLoading, setIsLoading] = useState(false);
  const [editingLeaveId, setEditingLeaveId] = useState<number | null>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const editingLeave = leaveTypes.find((leave) => leave.id === editingLeaveId);

  const showAlert = (props: AlertProps) => {
    setAlertProps(props);
    setAlertKey((key) => key + 1);
  };

  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  const fetchLeaveTypes = async () => {
    setIsLoading(true);
    try {
      const response = await getLeaveTypes();
      setLeaveTypes(response.data.leave_types);
    } catch (error) {
      showAlert({
        type: "danger",
        text: error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLeave = async (data: LeaveFormData) => {
    try {
      const response = await postLeaveTypes({
        name: data.name.trim(),
        days: Number(data.days),
        attachment_required: data.attachment_required,
      });
      reset();
      setLeaveTypes((prev) => [...prev, response.data.leave_type]);
      showAlert({
        type: "success",
        text: "Leave type created successfully.",
      });
    } catch (error) {
      showAlert({
        type: "danger",
        text: error instanceof Error ? error.message : "Something went wrong.",
      });
    }
  };

  const closeEditModal = () => {
    setEditingLeaveId(null);
    setIsTogglingStatus(false);
    resetEdit();
  };

  const handleEditClick = (leaveId: number) => {
    const leave = leaveTypes.find((item) => item.id === leaveId);
    if (!leave) return;

    resetEdit({
      name: leave.name,
      days: String(leave.days_per_year),
      attachment_required: leave.requires_attachment,
    });
    triggerEdit();
    setEditingLeaveId(leave.id);
  };

  const handleUpdateLeave = async (data: LeaveFormData) => {
    if (editingLeaveId === null) return;

    try {
      const response = await putLeaveTypes(editingLeaveId, {
        name: data.name.trim(),
        days: Number(data.days),
        attachment_required: data.attachment_required,
      });
      setLeaveTypes((prev) =>
        prev.map((leave) =>
          leave.id === editingLeaveId ? response.data.leave_type : leave
        )
      );
      closeEditModal();
      showAlert({
        type: "success",
        text: "Leave type updated successfully.",
      });
    } catch (error) {
      showAlert({
        type: "danger",
        text: error instanceof Error ? error.message : "Something went wrong.",
      });
    }
  };

  const handleToggleActive = async () => {
    if (editingLeaveId === null || !editingLeave) return;

    setIsTogglingStatus(true);
    try {
      const response = await patchLeaveTypes(editingLeaveId, {
        is_active: !editingLeave.is_active,
      });
      setLeaveTypes((prev) =>
        prev.map((leave) =>
          leave.id === editingLeaveId ? response.data.leave_type : leave
        )
      );
      closeEditModal();
    } catch (error) {
      showAlert({
        type: "danger",
        text: error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const columns = [
    { column: "Leave", type: "string", sorting: true, searching: true },
    {
      column: "Days (per year)",
      type: "string",
      sorting: true,
      searching: true,
    },
    { column: "Attachment", type: "string" },
    { column: "Action" },
  ];

  const filteredLeaveTypes = leaveTypes.filter(
    (leave) =>
      matchesDaysFilters(leave, filters.days) &&
      matchesAttachmentFilters(leave, filters.attachment) &&
      matchesStatusFilters(leave, filters.status)
  );

  const tableData = filteredLeaveTypes.map((leave) => [
    leave.name,
    String(leave.days_per_year),
    leave.requires_attachment ? "Yes" : "No",
    "Edit",
  ]);

  const rowIds = filteredLeaveTypes.map((leave) => leave.id);

  const toggleFilter = <
    G extends keyof LeaveFilters,
    K extends keyof LeaveFilters[G]
  >(
    group: G,
    key: K
  ) => {
    setFilters((prev) => ({
      ...prev,
      [group]: { ...prev[group], [key]: !prev[group][key] },
    }));
  };

  const clearFilters = () => {
    setFilters(defaultLeaveFilters);
  };

  const getFilterChild = () => {
    return (
      <div className="filter_panel">
        <div className="filter_groups">
          <div className="filter_group">
            <h3 className="filter_heading">Days per Year</h3>
            <label className="filter_option">
              <input
                type="checkbox"
                checked={filters.days.lte15}
                onChange={() => toggleFilter("days", "lte15")}
              />
              ≤ 15 days
            </label>
            <label className="filter_option">
              <input
                type="checkbox"
                checked={filters.days.mid}
                onChange={() => toggleFilter("days", "mid")}
              />
              16-30 days
            </label>
            <label className="filter_option">
              <input
                type="checkbox"
                checked={filters.days.gt30}
                onChange={() => toggleFilter("days", "gt30")}
              />
              {"> 30 days"}
            </label>
          </div>

          <div className="filter_group">
            <h3 className="filter_heading">Attachment Required</h3>
            <label className="filter_option">
              <input
                type="checkbox"
                checked={filters.attachment.required}
                onChange={() => toggleFilter("attachment", "required")}
              />
              Required
            </label>
            <label className="filter_option">
              <input
                type="checkbox"
                checked={filters.attachment.notRequired}
                onChange={() => toggleFilter("attachment", "notRequired")}
              />
              Not Required
            </label>
          </div>

          <div className="filter_group">
            <h3 className="filter_heading">Status</h3>
            <label className="filter_option">
              <input
                type="checkbox"
                checked={filters.status.active}
                onChange={() => toggleFilter("status", "active")}
              />
              Active (default)
            </label>
            <label className="filter_option">
              <input
                type="checkbox"
                checked={filters.status.inactive}
                onChange={() => toggleFilter("status", "inactive")}
              />
              Inactive
            </label>
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

      <BreadCrumb title="Leave Module" path="Leave Types" />

      <div className="leave_section">
        <h3>Add Leave</h3>
        <form className="leave_form" onSubmit={handleSubmit(handleAddLeave)}>
          {renderLeaveFormFields(register)}
          <div className="btn_container">
            <button
              type="submit"
              className={`primary_btn ${
                (!formState.isValid || formState.isSubmitting) && "disabled"
              }`}
              disabled={!formState.isValid || formState.isSubmitting}
            >
              {formState.isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>

      <Table
        header="All Leave Types"
        columns={columns}
        data={tableData}
        rowIds={rowIds}
        onEditClick={(id) => handleEditClick(Number(id))}
        hasFilters={true}
        filterChild={getFilterChild}
        loading={isLoading}
      />

      <Modal
        isOpen={editingLeaveId !== null}
        onClose={closeEditModal}
        title="Edit Leave"
      >
        <form
          className="leave_form"
          onSubmit={handleSubmitEdit(handleUpdateLeave)}
        >
          {renderLeaveFormFields(editRegister, "edit-")}
          <div className="btn_container">
            {editingLeave && (
              <button
                type="button"
                style={{ marginRight: "auto" }}
                className={`secondary_btn ${isTogglingStatus && "disabled"}`}
                onClick={handleToggleActive}
                disabled={isTogglingStatus || editFormState.isSubmitting}
              >
                {isTogglingStatus
                  ? "Updating..."
                  : editingLeave.is_active
                  ? "Mark as Inactive"
                  : "Mark as Active"}
              </button>
            )}
            <button
              type="submit"
              className={`primary_btn ${
                (!editFormState.isValid ||
                  editFormState.isSubmitting ||
                  isTogglingStatus) &&
                "disabled"
              }`}
              disabled={
                !editFormState.isValid ||
                editFormState.isSubmitting ||
                isTogglingStatus
              }
            >
              {editFormState.isSubmitting ? "Saving..." : "Save"}
            </button>
            <button
              className="cancel_button"
              type="button"
              onClick={closeEditModal}
              disabled={isTogglingStatus || editFormState.isSubmitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default LeaveTypes;
