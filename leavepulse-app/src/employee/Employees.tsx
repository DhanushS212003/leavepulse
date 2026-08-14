import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import BreadCrumb from "../breadcrumb/Breadcrumb";
import Table from "../table/Table";
import {
  getEmployees,
  patchEmployees,
  putEmployees,
  type Employee,
} from "../services/employeesService";
import Alert, { type AlertProps } from "../common/alert/Alert";
import Modal from "../common/modal/Modal";
import {
  EMAIL_REGEX,
  ROLE_DISPLAY_TO_VALUE,
  ROLE_VALUE_TO_DISPLAY,
  renderEmployeeFormFields,
  type EmployeeFormData,
} from "./employeeFormFields";
import "./add_employee.css";
import "../common/filter.css";

type EmployeeFilters = {
  role: { employee: boolean; manager: boolean; hr: boolean };
  status: { active: boolean; inactive: boolean };
};

const defaultEmployeeFilters: EmployeeFilters = {
  role: { employee: false, manager: false, hr: false },
  status: { active: true, inactive: false },
};

const matchesRoleFilters = (
  employee: Employee,
  role: EmployeeFilters["role"]
) => {
  const hasSelection = role.employee || role.manager || role.hr;
  if (!hasSelection) return true;

  const normalizedRole = employee.role.trim().toLowerCase();

  return (
    (role.employee && normalizedRole === "employee") ||
    (role.manager && normalizedRole === "manager") ||
    (role.hr && normalizedRole === "hr")
  );
};

const matchesStatusFilters = (
  employee: Employee,
  status: EmployeeFilters["status"]
) => {
  const hasSelection = status.active || status.inactive;
  if (!hasSelection) return false;

  return (
    (status.active && employee.is_active) ||
    (status.inactive && !employee.is_active)
  );
};

const Employees = () => {
  const {
    register: editRegister,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    trigger: triggerEdit,
    watch: watchEdit,
    setValue: setValueEdit,
    formState: editFormState,
  } = useForm<EmployeeFormData>();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filters, setFilters] = useState<EmployeeFilters>(
    defaultEmployeeFilters
  );
  const [isLoading, setIsLoading] = useState(false);
  const [alertKey, setAlertKey] = useState(0);
  const [alertProps, setAlertProps] = useState<AlertProps>({
    type: "danger",
    text: "",
  });
  const [editingEmployeeId, setEditingEmployeeId] = useState<number | null>(
    null
  );
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const editingEmployee = employees.find(
    (employee) => employee.id === editingEmployeeId
  );
  const editRole = watchEdit("role");

  const columns = [
    { column: "Code", sorting: true, type: "string", searching: true },
    { column: "First Name", sorting: true, type: "string", searching: true },
    { column: "Last Name", sorting: true, type: "string", searching: true },
    { column: "Email", sorting: true, type: "string", searching: true },
    { column: "Role", sorting: true, type: "string", searching: true },
    { column: "Manager", sorting: true, type: "string", searching: true },
    { column: "Joined Date", sorting: true, type: "date", searching: true },
    { column: "Action" },
  ];

  const showAlert = (props: AlertProps) => {
    setAlertProps(props);
    setAlertKey((key) => key + 1);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const response = await getEmployees();
      setEmployees(response.data.employees);
    } catch (error) {
      showAlert({
        type: "danger",
        text: error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const closeEditModal = () => {
    setEditingEmployeeId(null);
    setIsTogglingStatus(false);
    resetEdit();
  };

  const handleEditClick = (employeeId: number) => {
    const employee = employees.find((item) => item.id === employeeId);
    if (!employee) return;

    const roleValue =
      ROLE_DISPLAY_TO_VALUE[employee.role.trim().toLowerCase()] ?? "";

    resetEdit({
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email,
      role: roleValue,
      manager_code: employee.manager ?? "",
      joining_date: employee.joined_date,
    });
    triggerEdit();
    setEditingEmployeeId(employee.id);
  };

  const handleUpdateEmployee = async (data: EmployeeFormData) => {
    if (editingEmployeeId === null) return;

    if (!EMAIL_REGEX.test(data.email)) {
      showAlert({
        type: "danger",
        text: "Please enter a valid email address",
      });
      return;
    }

    try {
      const managerCode = data.manager_code?.trim() ?? "";
      await putEmployees(editingEmployeeId, {
        first_name: data.first_name.trim(),
        last_name: data.last_name.trim(),
        email: data.email.trim(),
        role: Number(data.role),
        manager_code: managerCode,
        joining_date: data.joining_date,
      });
      setEmployees((prev) =>
        prev.map((employee) =>
          employee.id === editingEmployeeId
            ? {
                ...employee,
                first_name: data.first_name.trim(),
                last_name: data.last_name.trim(),
                email: data.email.trim(),
                role: ROLE_VALUE_TO_DISPLAY[data.role] ?? employee.role,
                manager: managerCode || null,
                joined_date: data.joining_date,
              }
            : employee
        )
      );
      closeEditModal();
      showAlert({
        type: "success",
        text: "Employee updated successfully.",
      });
    } catch (error) {
      showAlert({
        type: "danger",
        text: error instanceof Error ? error.message : "Something went wrong.",
      });
    }
  };

  const handleToggleActive = async () => {
    if (editingEmployeeId === null || !editingEmployee) return;

    setIsTogglingStatus(true);
    try {
      const nextIsActive = !editingEmployee.is_active;
      await patchEmployees(editingEmployeeId, {
        is_active: nextIsActive,
      });
      setEmployees((prev) =>
        prev.map((employee) =>
          employee.id === editingEmployeeId
            ? { ...employee, is_active: nextIsActive }
            : employee
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

  const filteredEmployees = employees.filter(
    (employee) =>
      matchesRoleFilters(employee, filters.role) &&
      matchesStatusFilters(employee, filters.status)
  );

  const tableData = filteredEmployees.map((employee) => [
    employee.code,
    employee.first_name,
    employee.last_name,
    employee.email,
    employee.role,
    employee.manager ?? "",
    employee.joined_date,
    "Edit",
  ]);

  const toggleFilter = <
    G extends keyof EmployeeFilters,
    K extends keyof EmployeeFilters[G]
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
    setFilters(defaultEmployeeFilters);
  };

  const getFilterChild = () => {
    return (
      <div className="filter_panel">
        <div className="filter_groups">
          <div className="filter_group">
            <h3 className="filter_heading">Role</h3>
            <label className="filter_option">
              <input
                type="checkbox"
                checked={filters.role.employee}
                onChange={() => toggleFilter("role", "employee")}
              />
              Employee
            </label>
            <label className="filter_option">
              <input
                type="checkbox"
                checked={filters.role.manager}
                onChange={() => toggleFilter("role", "manager")}
              />
              Manager
            </label>
            <label className="filter_option">
              <input
                type="checkbox"
                checked={filters.role.hr}
                onChange={() => toggleFilter("role", "hr")}
              />
              HR
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
      <BreadCrumb title="Employee Module" path="Manage Employee" />

      {alertProps.text && <Alert key={alertKey} {...alertProps} />}

      <Table
        header="All Employees"
        columns={columns}
        data={tableData}
        rowIds={filteredEmployees.map((employee) => employee.id)}
        onEditClick={(id) => handleEditClick(Number(id))}
        hasFilters={true}
        filterChild={getFilterChild}
        loading={isLoading}
      />

      <Modal
        isOpen={editingEmployeeId !== null}
        onClose={closeEditModal}
        title="Edit Employee"
      >
        <form
          className="employee_form"
          onSubmit={handleSubmitEdit(handleUpdateEmployee)}
        >
          {renderEmployeeFormFields(editRegister, setValueEdit, editRole, {
            idPrefix: "edit-",
            showPassword: false,
          })}
          <div className="btn_container">
            {editingEmployee && (
              <button
                type="button"
                style={{ marginRight: "auto" }}
                className={`secondary_btn ${isTogglingStatus && "disabled"}`}
                onClick={handleToggleActive}
                disabled={isTogglingStatus || editFormState.isSubmitting}
              >
                {isTogglingStatus
                  ? "Updating..."
                  : editingEmployee.is_active
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

export default Employees;
