import { useEffect, useState } from "react";
import banner from "../assets/img/dashboard_banner.png";
import Alert, { type AlertProps } from "../common/alert/Alert";
import { useAppContext } from "../context";
import { getTeamMembers, type Employee } from "../services/employeesService";
import { getHolidays, type Holiday } from "../services/holidaysService";
import Table from "../table/Table";
import "./home.css";

const teamMemberColumns = [
  { column: "Code", sorting: true, type: "string", searching: true },
  { column: "First Name", sorting: true, type: "string", searching: true },
  { column: "Last Name", sorting: true, type: "string", searching: true },
  { column: "Email", sorting: true, type: "string", searching: true },
  { column: "Role", sorting: true, type: "string", searching: true },
  { column: "Joined Date", sorting: true, type: "date", searching: true },
];

const holidayColumns = [
  { column: "Holiday", sorting: true, type: "string", searching: true },
  { column: "Date", sorting: true, type: "date", searching: true },
];

const Home = () => {
  const { currentUser } = useAppContext();
  const showTeamMembers =
    currentUser != null && currentUser.role !== "Employee";
  const [teamMembers, setTeamMembers] = useState<Employee[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isTeamMembersLoading, setIsTeamMembersLoading] = useState(false);
  const [isHolidaysLoading, setIsHolidaysLoading] = useState(true);
  const [alertProps, setAlertProps] = useState<AlertProps | null>(null);
  const [alertKey, setAlertKey] = useState(0);

  const showAlert = (props: AlertProps) => {
    setAlertProps(props);
    setAlertKey((key) => key + 1);
  };

  useEffect(() => {
    if (!currentUser) return;

    const fetchHolidays = async () => {
      setIsHolidaysLoading(true);
      try {
        const response = await getHolidays({ mode: "upcoming" });
        setHolidays(response.data.holidays);
      } catch (error) {
        showAlert({
          type: "danger",
          text:
            error instanceof Error ? error.message : "Something went wrong.",
        });
      } finally {
        setIsHolidaysLoading(false);
      }
    };

    const fetchTeamMembers = async () => {
      if (currentUser.role === "Employee") return;

      setIsTeamMembersLoading(true);
      try {
        const response = await getTeamMembers();
        setTeamMembers(response.data.team_members);
      } catch (error) {
        showAlert({
          type: "danger",
          text:
            error instanceof Error ? error.message : "Something went wrong.",
        });
      } finally {
        setIsTeamMembersLoading(false);
      }
    };

    fetchHolidays();
    fetchTeamMembers();
  }, [currentUser]);

  const teamMembersTableData = teamMembers.map((member) => [
    member.code,
    member.first_name,
    member.last_name,
    member.email,
    member.role,
    member.joined_date,
  ]);

  const holidaysTableData = holidays.map((holiday) => [
    holiday.name,
    holiday.date,
  ]);

  return (
    <>
      {alertProps && <Alert key={alertKey} {...alertProps} />}

      <div className="dashboard_section">
        <div className="banner_container">
          <img src={banner} className="banner_img" alt="Banner" />
          <div>
            <p className="welcome_tag">Welcome Back</p>
            <h2 className="banner_user_name">{`${
              currentUser?.first_name ?? ""
            } ${currentUser?.last_name ?? ""}`}</h2>
            <p className="banner_line">
              Glad to have you back.
              <br />
              Wishing you a smooth and a production day ahead!
            </p>
          </div>
        </div>
      </div>

      {showTeamMembers && (
        <Table
          header="Team Members"
          columns={teamMemberColumns}
          data={teamMembersTableData}
          loading={isTeamMembersLoading}
        />
      )}

      <Table
        header="Upcoming Holidays"
        columns={holidayColumns}
        data={holidaysTableData}
        loading={isHolidaysLoading}
      />
    </>
  );
};

export default Home;
