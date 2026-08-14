import type { UseFormRegister, UseFormSetValue } from "react-hook-form";
import LabelAsterisk from "../common/LabelAsterisk";

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const HR_ROLE = "1";

export const ROLE_DISPLAY_TO_VALUE: Record<string, string> = {
  hr: "1",
  manager: "2",
  employee: "3",
};

export const ROLE_VALUE_TO_DISPLAY: Record<string, string> = {
  "1": "HR",
  "2": "Manager",
  "3": "Employee",
};

export type EmployeeFormData = {
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  manager_code: string;
  password: string;
  joining_date: string;
};

type RenderEmployeeFormFieldsOptions = {
  idPrefix?: string;
  showPassword?: boolean;
};

export const renderEmployeeFormFields = (
  register: UseFormRegister<EmployeeFormData>,
  setValue: UseFormSetValue<EmployeeFormData>,
  role: string,
  { idPrefix = "", showPassword = true }: RenderEmployeeFormFieldsOptions = {}
) => {
  const isManagerCodeDisabled = role === HR_ROLE;
  const isManagerCodeRequired = !isManagerCodeDisabled;

  return (
    <div className="fields_container">
      <div className="field_container">
        <label htmlFor={`${idPrefix}first_name`}>
          First Name <LabelAsterisk />
        </label>
        <input
          id={`${idPrefix}first_name`}
          type="text"
          {...register("first_name", {
            required: true,
            validate: (value) => value.trim().length > 0,
          })}
        />
      </div>
      <div className="field_container">
        <label htmlFor={`${idPrefix}last_name`}>
          Last Name <LabelAsterisk />
        </label>
        <input
          id={`${idPrefix}last_name`}
          type="text"
          {...register("last_name", {
            required: true,
            validate: (value) => value.trim().length > 0,
          })}
        />
      </div>
      <div className="field_container">
        <label htmlFor={`${idPrefix}email`}>
          Email <LabelAsterisk />
        </label>
        <input
          id={`${idPrefix}email`}
          type="email"
          {...register("email", {
            required: true,
            validate: (value) => value.trim().length > 0,
          })}
        />
      </div>
      <div className="field_container">
        <label htmlFor={`${idPrefix}role`}>
          Role <LabelAsterisk />
        </label>
        <select
          id={`${idPrefix}role`}
          {...register("role", {
            required: true,
            onChange: (event) => {
              if (event.target.value === HR_ROLE) {
                setValue("manager_code", "");
              }
            },
          })}
        >
          <option value="">Select role</option>
          <option value={3}>Employee</option>
          <option value={2}>Manager</option>
          <option value={1}>HR</option>
        </select>
      </div>
      <div className="field_container">
        <label htmlFor={`${idPrefix}manager_code`}>
          Manager Code {isManagerCodeRequired && <LabelAsterisk />}
        </label>
        <input
          id={`${idPrefix}manager_code`}
          type="text"
          {...register("manager_code", {
            required: isManagerCodeRequired,
            validate: (value) =>
              !isManagerCodeRequired || value.trim().length > 0,
          })}
          disabled={isManagerCodeDisabled}
        />
      </div>
      {showPassword && (
        <div className="field_container">
          <label htmlFor={`${idPrefix}password`}>
            Password <LabelAsterisk />
          </label>
          <input
            id={`${idPrefix}password`}
            type="password"
            {...register("password", {
              required: true,
              validate: (value) => value.trim().length > 0,
            })}
          />
        </div>
      )}
      <div className="field_container">
        <label htmlFor={`${idPrefix}joining_date`}>
          Joining Date <LabelAsterisk />
        </label>
        <input
          id={`${idPrefix}joining_date`}
          type="date"
          {...register("joining_date", {
            required: true,
          })}
        />
      </div>
    </div>
  );
};
