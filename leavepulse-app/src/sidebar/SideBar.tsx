import "./sidebar.css";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAppContext } from "../context";

type Props = {
  isOpen?: boolean;
  onClose?: () => void;
};

const SideBar = ({ isOpen = false, onClose }: Props) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [isEmployeeExpanded, setIsEmployeeExpanded] = useState(false);
  const [isLeaveExpanded, setIsLeaveExpanded] = useState(false);
  const { currentUser } = useAppContext();

  const rowClassName = (path: string) => {
    const isActive = path === "/" ? pathname === "/" : pathname === path;

    return `sidebar_row_container${isActive ? " active" : ""}`;
  };

  const hiddenListClassName = (path: string) =>
    `hidden_list_container${pathname === path ? " active" : ""}`;

  useEffect(() => {
    if (pathname === "/add/employee" || pathname === "/manage/employees") {
      setIsEmployeeExpanded(true);
    }
  }, [pathname]);

  useEffect(() => {
    if (
      pathname === "/apply_leave" ||
      pathname === "/my_leaves" ||
      pathname === "/leave_summary" ||
      pathname === "/team_leaves"
    ) {
      setIsLeaveExpanded(true);
    }
  }, [pathname]);

  const goTo = (path: string) => {
    navigate(path);
    onClose?.();
  };

  const toggleEmployeeHiddenLinksContainer = () => {
    setIsEmployeeExpanded(!isEmployeeExpanded);
  };

  const toggleLeaveHiddenLinksContainer = () => {
    setIsLeaveExpanded(!isLeaveExpanded);
  };

  return (
    <>
      {isOpen && (
        <div
          className="sidebar_backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <div className={`sidebar_section${isOpen ? " open" : ""}`}>
        <div className={rowClassName("/")} onClick={() => goTo("/")}>
          <div className="sidebar_icon_container">
            <i className="fa-solid fa-house"></i>
          </div>
          <p> Home </p>
        </div>

        {currentUser?.access.manage_leave_types && (
          <div
            className={rowClassName("/manage/leaves")}
            onClick={() => goTo("/manage/leaves")}
          >
            <div className="sidebar_icon_container">
              <i className="fa-solid fa-rectangle-list"></i>
            </div>
            <p> Leave Types </p>
          </div>
        )}

        {currentUser?.access.manage_employees && (
          <div
            className="sidebar_row_container"
            onClick={toggleEmployeeHiddenLinksContainer}
          >
            <div className="sidebar_icon_container">
              <i className="fa-solid fa-users-rectangle"></i>
            </div>
            <div className="link_container">
              <p> Employees </p>
              <i
                className={`fa-solid fa-chevron-${
                  isEmployeeExpanded ? "up" : "down"
                }`}
              />
            </div>
          </div>
        )}

        {isEmployeeExpanded && (
          <>
            <div
              className={hiddenListClassName("/add/employee")}
              onClick={() => goTo("/add/employee")}
            >
              <i className="fa-regular fa-circle-dot"></i>
              <p> Add Employee </p>
            </div>

            <div
              className={hiddenListClassName("/manage/employees")}
              onClick={() => goTo("/manage/employees")}
            >
              <i className="fa-regular fa-circle-dot"></i>
              <p> Manage Employee </p>
            </div>
          </>
        )}

        <div
          className="sidebar_row_container"
          onClick={toggleLeaveHiddenLinksContainer}
        >
          <div className="sidebar_icon_container">
            <i className="fa-solid fa-calendar-check"></i>
          </div>
          <div className="link_container">
            <p> Leaves </p>
            <i
              className={`fa-solid fa-chevron-${
                isLeaveExpanded ? "up" : "down"
              }`}
            ></i>
          </div>
        </div>

        {isLeaveExpanded && (
          <>
            <div
              className={hiddenListClassName("/apply_leave")}
              onClick={() => goTo("/apply_leave")}
            >
              <i className="fa-regular fa-circle-dot"></i>
              <p> Apply Leave </p>
            </div>

            <div
              className={hiddenListClassName("/my_leaves")}
              onClick={() => goTo("/my_leaves")}
            >
              <i className="fa-regular fa-circle-dot"></i>
              <p> My Leaves </p>
            </div>
            <div
              className={hiddenListClassName("/leave_summary")}
              onClick={() => goTo("/leave_summary")}
            >
              <i className="fa-regular fa-circle-dot"></i>
              <p> Summary </p>
            </div>
            {currentUser?.access.manage_team_leaves && (
              <div
                className={hiddenListClassName("/team_leaves")}
                onClick={() => goTo("/team_leaves")}
              >
                <i className="fa-regular fa-circle-dot"></i>
                <p> Team Leaves </p>
              </div>
            )}
          </>
        )}

        {currentUser?.access.manage_org && (
          <div
            className={rowClassName("/manage/org")}
            onClick={() => goTo("/manage/org")}
          >
            <div className="sidebar_icon_container">
              <i className="fa-solid fa-sitemap"></i>{" "}
            </div>
            <p> My Org </p>
          </div>
        )}

        {currentUser?.access.manage_leave_types && (
          <div
            className={rowClassName("/manage/holidays")}
            onClick={() => goTo("/manage/holidays")}
          >
            <div className="sidebar_icon_container">
              <i className="fa-solid fa-paper-plane"></i>
            </div>
            <p> Holidays </p>
          </div>
        )}

        <div
          className={rowClassName("/calendar")}
          onClick={() => goTo("/calendar")}
        >
          <div className="sidebar_icon_container">
            <i className="fa-solid fa-calendar-days"></i>
          </div>
          <p> Calendar </p>
        </div>

        <div
          className={rowClassName("/product_overview")}
          onClick={() => goTo("/product_overview")}
        >
          <div className="sidebar_icon_container">
            <i className="fa-solid fa-display"></i>
          </div>
          <p> Product Overview </p>
        </div>
      </div>
    </>
  );
};

export default SideBar;
