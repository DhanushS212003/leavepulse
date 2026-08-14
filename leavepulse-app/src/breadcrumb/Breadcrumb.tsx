import { useNavigate } from "react-router-dom";
import "./breadcrumb.css";

type Props = {
  title: string;
  path: string;
};

const BreadCrumb = ({ title, path }: Props) => {
  const navigate = useNavigate();

  return (
    <div className="breadcrumbs_container">
      <h2 style={{ marginBottom: "12px" }}>{title}</h2>
      <p>
        <span className="link" onClick={() => navigate("/")}>Home</span>
        {" > "}
        {path}
      </p>
    </div>
  );
};

export default BreadCrumb;
