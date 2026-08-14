import { useState } from "react";
import { useForm } from "react-hook-form";
import BreadCrumb from "../breadcrumb/Breadcrumb";
import Alert, { type AlertProps } from "../common/alert/Alert";
import { postEmployees } from "../services/employeesService";
import {
  EMAIL_REGEX,
  renderEmployeeFormFields,
  type EmployeeFormData,
} from "./employeeFormFields";
import "./add_employee.css";

const AddEmployee = () => {
  const { register, handleSubmit, reset, formState, watch, setValue } =
    useForm<EmployeeFormData>();
  const [alertProps, setAlertProps] = useState<AlertProps | null>(null);
  const [alertKey, setAlertKey] = useState(0);
  const role = watch("role");

  const showAlert = (props: AlertProps) => {
    setAlertProps(props);
    setAlertKey((key) => key + 1);
  };

  const handleCreateEmployee = async (data: EmployeeFormData) => {
    if (!EMAIL_REGEX.test(data.email)) {
      showAlert({
        type: "danger",
        text: "Please enter a valid email address",
      });
      return;
    }

    try {
      await postEmployees({
        first_name: data.first_name.trim(),
        last_name: data.last_name.trim(),
        email: data.email.trim(),
        role: Number(data.role),
        manager_code: data.manager_code?.trim() ?? "",
        password: data.password,
        joining_date: data.joining_date,
      });
      showAlert({
        type: "success",
        text: "Employee created successfully.",
      });
      reset();
    } catch (error) {
      showAlert({
        type: "danger",
        text: error instanceof Error ? error.message : "Something went wrong.",
      });
    }
  };

  return (
    <>
      {alertProps && <Alert key={alertKey} {...alertProps} />}

      <BreadCrumb title="Employee Module" path="Add Employee" />

      <div className="employee_form_section">
        <h3>Application Form</h3>
        <form
          className="employee_form"
          onSubmit={handleSubmit(handleCreateEmployee)}
        >
          {renderEmployeeFormFields(register, setValue, role)}
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
    </>
  );
};

export default AddEmployee;
