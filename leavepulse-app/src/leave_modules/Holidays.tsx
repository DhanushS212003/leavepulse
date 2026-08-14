import "../leave_type/leave_types.css";
import BreadCrumb from "../breadcrumb/Breadcrumb";
import Table from "../table/Table";
import { useEffect, useState } from "react";
import {
  deleteHoliday,
  getHolidays,
  postHoliday,
  putHoliday,
  type Holiday,
} from "../services/holidaysService";
import type { AlertProps } from "../common/alert/Alert";
import Alert from "../common/alert/Alert";
import Modal from "../common/modal/Modal";
import { useForm, type UseFormRegister } from "react-hook-form";
import LabelAsterisk from "../common/LabelAsterisk";

type HolidayFormData = {
  name: string;
  date: string;
};

const renderHolidayFormFields = (
  register: UseFormRegister<HolidayFormData>,
  idPrefix = ""
) => (
  <div className="fields_container">
    <div className="field_container">
      <label htmlFor={`${idPrefix}name`}>
        Holiday Name <LabelAsterisk />
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
      <label htmlFor={`${idPrefix}date`}>
        Date <LabelAsterisk />
      </label>
      <input
        id={`${idPrefix}date`}
        type="date"
        {...register("date", { required: true })}
      />
    </div>
  </div>
);

const Holidays = () => {
  const { register, handleSubmit, reset, formState } =
    useForm<HolidayFormData>();
  const {
    register: editRegister,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    trigger: triggerEdit,
    formState: editFormState,
  } = useForm<HolidayFormData>();
  const [alertProps, setAlertProps] = useState<AlertProps | null>(null);
  const [alertKey, setAlertKey] = useState(0);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingHolidayId, setEditingHolidayId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showAlert = (props: AlertProps) => {
    setAlertProps(props);
    setAlertKey((key) => key + 1);
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    setIsLoading(true);
    try {
      const response = await getHolidays();
      setHolidays(response.data.holidays);
    } catch (error) {
      showAlert({
        type: "danger",
        text: error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddHoliday = async (data: HolidayFormData) => {
    try {
      const response = await postHoliday({
        name: data.name.trim(),
        date: data.date,
      });
      reset();
      setHolidays((prev) => [...prev, response.data.holiday]);
      showAlert({
        type: "success",
        text: "Holiday created successfully.",
      });
    } catch (error) {
      showAlert({
        type: "danger",
        text: error instanceof Error ? error.message : "Something went wrong.",
      });
    }
  };

  const closeEditModal = () => {
    setEditingHolidayId(null);
    setIsDeleting(false);
    resetEdit();
  };

  const handleEditClick = (holidayId: number) => {
    const holiday = holidays.find((item) => item.id === holidayId);
    if (!holiday) return;

    resetEdit({
      name: holiday.name,
      date: holiday.date,
    });
    triggerEdit();
    setEditingHolidayId(holiday.id);
  };

  const handleUpdateHoliday = async (data: HolidayFormData) => {
    if (editingHolidayId === null) return;

    try {
      const response = await putHoliday(editingHolidayId, {
        name: data.name.trim(),
        date: data.date,
      });
      setHolidays((prev) =>
        prev.map((holiday) =>
          holiday.id === editingHolidayId ? response.data.holiday : holiday
        )
      );
      closeEditModal();
      showAlert({
        type: "success",
        text: "Holiday updated successfully.",
      });
    } catch (error) {
      showAlert({
        type: "danger",
        text: error instanceof Error ? error.message : "Something went wrong.",
      });
    }
  };

  const handleDeleteHoliday = async () => {
    if (editingHolidayId === null) return;

    setIsDeleting(true);
    try {
      await deleteHoliday(editingHolidayId);
      setHolidays((prev) =>
        prev.filter((holiday) => holiday.id !== editingHolidayId)
      );
      closeEditModal();
      showAlert({
        type: "success",
        text: "Holiday deleted successfully.",
      });
    } catch (error) {
      showAlert({
        type: "danger",
        text: error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    { column: "Holiday" },
    { column: "Date" },
    { column: "Action" },
  ];

  const tableData = holidays.map((holiday) => [
    holiday.name,
    holiday.date,
    "Edit",
  ]);

  const rowIds = holidays.map((holiday) => holiday.id);

  return (
    <>
      {alertProps && <Alert key={alertKey} {...alertProps} />}

      <BreadCrumb title="Holiday Module" path="Holidays" />

      <div className="leave_section">
        <h3>Add Holiday</h3>
        <form className="leave_form" onSubmit={handleSubmit(handleAddHoliday)}>
          {renderHolidayFormFields(register)}
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
        header="All Holidays"
        columns={columns}
        data={tableData}
        rowIds={rowIds}
        onEditClick={(id) => handleEditClick(Number(id))}
        loading={isLoading}
      />

      <Modal
        isOpen={editingHolidayId !== null}
        onClose={closeEditModal}
        title="Edit Holiday"
      >
        <form
          className="leave_form"
          onSubmit={handleSubmitEdit(handleUpdateHoliday)}
        >
          {renderHolidayFormFields(editRegister, "edit-")}
          <div className="btn_container">
            <button
              type="button"
              style={{ marginRight: "auto" }}
              className={`danger_btn ${isDeleting && "disabled"}`}
              onClick={handleDeleteHoliday}
              disabled={isDeleting || editFormState.isSubmitting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
            <button
              type="submit"
              className={`primary_btn ${
                (!editFormState.isValid ||
                  editFormState.isSubmitting ||
                  isDeleting) &&
                "disabled"
              }`}
              disabled={
                !editFormState.isValid ||
                editFormState.isSubmitting ||
                isDeleting
              }
            >
              {editFormState.isSubmitting ? "Saving..." : "Save"}
            </button>
            <button
              className="cancel_button"
              type="button"
              onClick={closeEditModal}
              disabled={isDeleting || editFormState.isSubmitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default Holidays;
