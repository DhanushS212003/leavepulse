import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import BreadCrumb from "../breadcrumb/Breadcrumb";
import Alert, { type AlertProps } from "../common/alert/Alert";
import { useAppContext } from "../context";
import {
  getEmployee,
  patchEmployeeProfile,
} from "../services/employeesService";
import profile_logo from "../assets/img/profile.jpg";
import "./profile.css";

type ProfileFormData = {
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  code: string;
  manager: string;
  joined_date: string;
};

const emptyFormValues: ProfileFormData = {
  first_name: "",
  last_name: "",
  email: "",
  role: "",
  code: "",
  manager: "",
  joined_date: "",
};

const Profile = () => {
  const { currentUser, setCurrentUser } = useAppContext();
  const { register, handleSubmit, reset, formState, watch } =
    useForm<ProfileFormData>({
      defaultValues: emptyFormValues,
    });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [alertProps, setAlertProps] = useState<AlertProps | null>(null);
  const [alertKey, setAlertKey] = useState(0);

  const firstName = watch("first_name");
  const lastName = watch("last_name");

  const showAlert = (props: AlertProps) => {
    setAlertProps(props);
    setAlertKey((key) => key + 1);
  };

  useEffect(() => {
    const employeeId = currentUser?.id;

    if (!employeeId) {
      setIsLoading(false);
      showAlert({
        type: "danger",
        text: "Employee not found for the current user.",
      });
      return;
    }

    const fetchEmployee = async () => {
      try {
        const response = await getEmployee(employeeId);
        const employee = response.data.employee;

        reset({
          first_name: employee.first_name,
          last_name: employee.last_name,
          email: employee.email,
          role: employee.role,
          code: employee.code,
          manager: employee.manager ?? "",
          joined_date: employee.joined_date,
        });
      } catch (error) {
        showAlert({
          type: "danger",
          text:
            error instanceof Error ? error.message : "Something went wrong.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployee();
  }, [currentUser?.id, reset]);

  const handleSave = async (data: ProfileFormData) => {
    const employeeId = currentUser?.id;

    if (!employeeId) return;

    try {
      const response = await patchEmployeeProfile(employeeId, {
        first_name: data.first_name.trim(),
        last_name: data.last_name.trim(),
      });
      const employee = response.data.employee;
      reset({
        first_name: employee.first_name,
        last_name: employee.last_name,
        email: employee.email,
        role: employee.role,
        code: employee.code,
        manager: employee.manager ?? "",
        joined_date: employee.joined_date,
      });
      setCurrentUser((prev) =>
        prev
          ? {
              ...prev,
              first_name: employee.first_name,
              last_name: employee.last_name,
            }
          : prev
      );
      setIsEditing(false);
      showAlert({
        type: "success",
        text: "Profile updated successfully.",
      });
    } catch (error) {
      showAlert({
        type: "danger",
        text: error instanceof Error ? error.message : "Something went wrong.",
      });
    }
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
  };

  const saveDisabled =
    !isEditing || !formState.isValid || formState.isSubmitting;

  const welcomeName = [firstName, lastName].filter(Boolean).join(" ");

  return (
    <>
      {alertProps && <Alert key={alertKey} {...alertProps} />}

      <BreadCrumb title="User Module" path="Profile" />

      <div className="profile_section">
        <div className="profile_container">
          <img src={profile_logo} className="profile_img" alt="Profile" />
          <p style={{ color: "darkslategray", fontWeight: "600" }}>
            Welcome {welcomeName}
          </p>
        </div>

        <div className="profile_info_container">
          {isLoading ? (
            <p style={{ padding: "20px" }}>Loading...</p>
          ) : (
            <form
              className="fields_container"
              onSubmit={handleSubmit(handleSave)}
            >
              <div className="field_container">
                <label htmlFor="profile-first-name">First Name</label>
                <input
                  id="profile-first-name"
                  type="text"
                  readOnly={!isEditing}
                  {...register("first_name", {
                    required: true,
                    validate: (value) => value.trim().length > 0,
                  })}
                />
              </div>
              <div className="field_container">
                <label htmlFor="profile-last-name">Last Name</label>
                <input
                  id="profile-last-name"
                  type="text"
                  readOnly={!isEditing}
                  {...register("last_name", {
                    required: true,
                    validate: (value) => value.trim().length > 0,
                  })}
                />
              </div>
              <div className="field_container">
                <label htmlFor="profile-email">Email</label>
                <input
                  id="profile-email"
                  type="text"
                  readOnly
                  {...register("email")}
                />
              </div>
              <div className="field_container">
                <label htmlFor="profile-role">Role</label>
                <input
                  id="profile-role"
                  type="text"
                  readOnly
                  {...register("role")}
                />
              </div>
              <div className="field_container">
                <label htmlFor="profile-code">Code</label>
                <input
                  id="profile-code"
                  type="text"
                  readOnly
                  {...register("code")}
                />
              </div>
              <div className="field_container">
                <label htmlFor="profile-manager">Manager</label>
                <input
                  id="profile-manager"
                  type="text"
                  readOnly
                  {...register("manager")}
                />
              </div>
              <div className="field_container">
                <label htmlFor="profile-joined-date">Joined Date</label>
                <input
                  id="profile-joined-date"
                  type="text"
                  readOnly
                  {...register("joined_date")}
                />
              </div>
              <div className="btn_container">
                {isEditing && (
                  <button
                    type="button"
                    className="cancel_button"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                )}
                <div className="btn_actions">
                  <button
                    type="button"
                    className="secondary_btn"
                    onClick={() => setIsEditing(true)}
                    disabled={isEditing}
                  >
                    Edit
                  </button>
                  <button
                    type="submit"
                    className={`primary_btn ${saveDisabled ? "disabled" : ""}`}
                    disabled={saveDisabled}
                  >
                    {formState.isSubmitting ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default Profile;
