import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import "./header.css";
import profile_logo from "../assets/img/profile.jpg";
import { useAppContext } from "../context";
import Alert, { type AlertProps } from "../common/alert/Alert";
import Modal from "../common/modal/Modal";
import { logout } from "../services/authService";
import { patchEmployeePassword } from "../services/employeesService";
import { setAccessToken } from "../authToken";

type ResetPasswordFormData = {
  password: string;
};

type Props = {
  isSidebarOpen: boolean,
  onToggleSidebar: () => void;
};

const Header = ({ isSidebarOpen, onToggleSidebar }: Props) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAppContext();
  const [alertProps, setAlertProps] = useState<AlertProps | null>(null);
  const [alertKey, setAlertKey] = useState(0);
  const { register, handleSubmit, reset, formState } =
    useForm<ResetPasswordFormData>({
      defaultValues: { password: "" },
    });

  const showAlert = (props: AlertProps) => {
    setAlertProps(props);
    setAlertKey((key) => key + 1);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleProfileContainer = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  const handleLogoClick = () => {
    navigate("/");
  };

  const handleProfileClick = () => {
    navigate("/profile");
    setIsProfileOpen(false);
  };

  const handleResetPasswordClick = () => {
    setIsProfileOpen(false);
    setIsResetPasswordOpen(true);
  };

  const closeResetPasswordModal = () => {
    setIsResetPasswordOpen(false);
    setShowPassword(false);
    reset();
  };

  const handleResetPassword = async (data: ResetPasswordFormData) => {
    const employeeId = currentUser?.id;
    if (!employeeId) {
      showAlert({
        type: "danger",
        text: "Employee not found for the current user.",
      });
      return;
    }

    try {
      await patchEmployeePassword(employeeId, {
        password: data.password,
      });
      closeResetPasswordModal();
      showAlert({
        type: "success",
        text: "Password updated successfully.",
      });
    } catch (error) {
      showAlert({
        type: "danger",
        text: error instanceof Error ? error.message : "Something went wrong.",
      });
    }
  };

  const handleLogOut = async () => {
    try {
      await logout();
      setAccessToken(null);
      navigate("/login");
    } catch (error) {
      showAlert({
        type: "danger",
        text: error instanceof Error ? error.message : "Logout failed",
      });
    }
  };

  // Handle Escape key press
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isProfileOpen) {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isProfileOpen]);

  const submitDisabled = !formState.isValid || formState.isSubmitting;

  return (
    <>
      {alertProps && <Alert key={alertKey} {...alertProps} />}

      <div className="header_section">
        <div className="header">
          <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
            <button
              type="button"
              className="menu_toggle"
              onClick={onToggleSidebar}
              aria-label="Toggle navigation menu"
            >
              <i className={`fa-solid ${isSidebarOpen ? "fa-bars-staggered" : "fa-bars"}`}></i>
            </button>
            <h2 className="logo" onClick={handleLogoClick}>
              LeavePulse
            </h2>
          </div>

          <div className="profile_container" onClick={toggleProfileContainer}>
            <img src={profile_logo} className="profile_photo" alt="Profile" />
            <p className="user_name">{`${currentUser?.first_name ?? ""} ${
              currentUser?.last_name ?? ""
            }`}</p>
            <i className="fa-solid fa-caret-down"></i>
          </div>
        </div>

        {isProfileOpen && (
          <div className="dropdown_container">
            <div
              className="dropdown_list_container"
              onClick={handleProfileClick}
            >
              <div className="icon_container">
                <i className="fa-solid fa-user"></i>
              </div>
              <p>Profile</p>
            </div>

            <div
              className="dropdown_list_container"
              onClick={handleResetPasswordClick}
            >
              <div className="icon_container">
                <i className="fa-solid fa-key"></i>
              </div>
              <p>Reset Password</p>
            </div>

            <div className="dropdown_list_container" onClick={handleLogOut}>
              <div className="icon_container">
                <i className="fa-solid fa-right-from-bracket"></i>
              </div>
              <p>Log Out</p>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isResetPasswordOpen}
        onClose={closeResetPasswordModal}
        title="Reset Password"
      >
        <form
          className="reset_password_form"
          onSubmit={handleSubmit(handleResetPassword)}
        >
          <div className="field_container">
            <label htmlFor="reset-password">Password</label>
            <input
              id="reset-password"
              type={showPassword ? "text" : "password"}
              {...register("password", {
                required: true,
                validate: (value) => value.trim().length > 0,
              })}
            />
            <div className="show_password_container">
              <input
                type="checkbox"
                id="reset-show-password-check"
                checked={showPassword}
                onChange={togglePasswordVisibility}
              />
              <label htmlFor="reset-show-password-check">Show Password</label>
            </div>
          </div>
          <div className="btn_container">
            <button
              type="button"
              className="cancel_button"
              onClick={closeResetPasswordModal}
              disabled={formState.isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`primary_btn ${submitDisabled ? "disabled" : ""}`}
              disabled={submitDisabled}
            >
              {formState.isSubmitting ? "Saving..." : "Submit"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default Header;
