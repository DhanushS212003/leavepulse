import { useEffect, useState } from "react";
import BreadCrumb from "../breadcrumb/Breadcrumb";
import Alert, { type AlertProps } from "../common/alert/Alert";
import { useAppContext } from "../context";
import { getLeaveSummary } from "../services/employeesService";
import Table from "../table/Table";

const columns = [
  { column: "Leave Type" },
  { column: "Available" },
  { column: "Used" },
];

const LeaveSummary = () => {
  const { currentUser } = useAppContext();
  const [data, setData] = useState<string[][]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [alertProps, setAlertProps] = useState<AlertProps | null>(null);
  const [alertKey, setAlertKey] = useState(0);

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

    const fetchLeaveSummary = async () => {
      try {
        const response = await getLeaveSummary(employeeId);
        setData(
          response.data.summary.map((item) => [
            item.leave,
            String(item.available),
            String(item.used),
          ])
        );
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

    fetchLeaveSummary();
  }, [currentUser?.id]);

  return (
    <>
      {alertProps && <Alert key={alertKey} {...alertProps} />}

      <BreadCrumb title="Leave Summary" path="Leave Balance" />

      <Table
        header="Leave Summary"
        columns={columns}
        data={data}
        loading={isLoading}
      />
    </>
  );
};

export default LeaveSummary;
