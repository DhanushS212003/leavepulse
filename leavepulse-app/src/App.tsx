import { useEffect, useState } from "react";
import Layout from "./common/Layout";
import { getUser, refreshToken } from "./services/authService";
import { useNavigate } from "react-router-dom";
import type { AlertProps } from "./common/alert/Alert";
import Alert from "./common/alert/Alert";
import { setAccessToken } from "./authToken";
import { AppContext, type User } from "./context";

const App = () => {
  const navigate = useNavigate();
  const [alertProps, setAlertProps] = useState<AlertProps | null>(null);
  const [alertKey, setAlertKey] = useState(0);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authInitializing, setAuthInitializing] = useState(true);

  useEffect(() => {
    refresh();
  }, []);

  const showAlert = (props: AlertProps) => {
    setAlertProps(props);
    setAlertKey((key) => key + 1);
  };

  const refresh = async () => {
    try {
      const response = await refreshToken();
      setAccessToken(response.data.access);
      fetchUser();
    } catch (error) {
      if (!(error instanceof Error)) return;

      if ("status" in error && error.status === 401) {
        showAlert({
          type: "danger",
          text: "Session logged out. Please Log In to continue",
        });

        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        showAlert({
          type: "danger",
          text: error.message,
        });
      }
    }
  };

  const fetchUser = async () => {
    try {
      const response = await getUser();
      setCurrentUser(response.data);
    } catch (error) {
      showAlert({
        type: "danger",
        text: error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setAuthInitializing(false);
    }
  };

  if (authInitializing) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {alertProps && <Alert key={alertKey} {...alertProps} />}

      <AppContext.Provider value={{ currentUser, setCurrentUser }}>
        <Layout />
      </AppContext.Provider>
    </>
  );
};

export default App;
