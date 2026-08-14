import App from "./App";
import Home from "./home/Home";
import Login from "./login/Login";
import LeaveTypes from "./leave_type/LeaveTypes";
import AddEmployee from "./employee/AddEmployee";
import ApplyLeave from "./leave_modules/ApplyLeave";
import PageNotFound from "./error/PageNotFound";
import Employees from "./employee/Employees";
import MyLeaves from "./leave_modules/MyLeaves";
import Profile from "./profile/Profile";
import Calendar from "./calendar/Calendar";
import ProductOverview from "./product_overview/ProductOverview";
import Organization from "./organization/Organization";
import RequireAccess from "./common/RequireAccess";
import LeaveSummary from "./leave_modules/LeaveSummary";
import Holidays from "./leave_modules/Holidays";
import TeamLeaves from "./leave_modules/TeamLeaves";

export const routes = [
  {
    path: "/",
    element: <App />,
    children: [
      { path: "", element: <Home /> },
      {
        path: "manage/leaves",
        element: (
          <RequireAccess access="manage_leave_types">
            <LeaveTypes />
          </RequireAccess>
        ),
      },
      {
        path: "manage/holidays",
        element: (
          <RequireAccess access="manage_leave_types">
            <Holidays />
          </RequireAccess>
        ),
      },
      {
        path: "add/employee",
        element: (
          <RequireAccess access="manage_employees">
            <AddEmployee />
          </RequireAccess>
        ),
      },
      {
        path: "apply_leave",
        element: <ApplyLeave />,
      },
      {
        path: "manage/employees",
        element: (
          <RequireAccess access="manage_employees">
            <Employees />
          </RequireAccess>
        ),
      },
      {
        path: "my_leaves",
        element: <MyLeaves />,
      },
      {
        path: "team_leaves",
        element: (
          <RequireAccess access="manage_team_leaves">
            <TeamLeaves />
          </RequireAccess>
        ),
      },
      { path: "leave_summary", element: <LeaveSummary /> },
      { path: "profile", element: <Profile /> },
      { path: "calendar", element: <Calendar /> },
      { path: "product_overview", element: <ProductOverview /> },
      {
        path: "manage/org",
        element: (
          <RequireAccess access="manage_org">
            <Organization />
          </RequireAccess>
        ),
      },
    ],
  },
  { path: "login", element: <Login /> },
  { path: "*", element: <PageNotFound /> },
];
