import { useState } from "react";
import img from "../assets/img/login_section.png";
import "./login.css";
import { useNavigate } from "react-router-dom";
import { login } from "../services/authService";
import Alert, { type AlertProps } from "../common/alert/Alert";
import { useForm } from "react-hook-form";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FormData = {
  email: string;
  password: string;
};

const Login = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState } = useForm<FormData>();
  const [showPassword, setShowPassword] = useState(false);
  const [alertProps, setAlertProps] = useState<AlertProps | null>(null);
  const [alertKey, setAlertKey] = useState(0);

  const showAlert = (props: AlertProps) => {
    setAlertProps(props);
    setAlertKey((key) => key + 1);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async (data: FormData) => {
    const email = data.email;
    const password = data.password;

    if (!EMAIL_REGEX.test(email)) {
      showAlert({
        type: "danger",
        text: "Please enter a valid email address",
      });
      return;
    }

    try {
      await login({ email, password });
      navigate("/");
    } catch (error) {
      showAlert({
        type: "danger",
        text: error instanceof Error ? error.message : "Login failed",
      });
    }
  };

  return (
    <>
      {alertProps && <Alert key={alertKey} {...alertProps} />}

      <div className="login_page_container">
        <div className="login_row">
          <div className="login_image_container">
            <img src={img} alt="Login" className="login_image" />
          </div>

          <div className="login_form_container">
            <div className="login_form_card">
              <div className="login_title_container">
                <h1>Login to LeavePulse</h1>
              </div>

              <form onSubmit={handleSubmit(handleLogin)}>
                <div className="login_field_container">
                  <input
                    id="email"
                    type="email"
                    placeholder="Email"
                    {...register("email", {
                      required: true,
                      validate: (value) => value.trim().length > 0,
                    })}
                  />
                </div>
                <div className="login_field_container">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    {...register("password", {
                      required: true,
                      validate: (value) => value.trim().length > 0,
                    })}
                  />
                </div>
                <div className="login_password_container">
                  <input
                    type="checkbox"
                    id="showPasswordCheck"
                    checked={showPassword}
                    onChange={togglePasswordVisibility}
                  />
                  <label htmlFor="showPasswordCheck">Show Password</label>
                </div>

                <div>
                  <button
                    type="submit"
                    className={`primary_btn ${
                      (!formState.isValid || formState.isSubmitting) &&
                      "disabled"
                    }`}
                    style={{ width: "100%" }}
                    disabled={!formState.isValid || formState.isSubmitting}
                  >
                    {formState.isSubmitting ? "Logging in..." : "Login"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
