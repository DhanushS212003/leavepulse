import { useEffect, useState } from "react";
import "./alert.css";

export type AlertProps = {
  type: "danger" | "success";
  text: string;
};

const BACKGROUND_COLORS = {
  danger: "#dc3545",
  success: "#28a745",
};

const Alert = ({ type, text }: AlertProps) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className="alert" style={{ backgroundColor: BACKGROUND_COLORS[type] }}>
      {text}
    </div>
  );
};

export default Alert;
