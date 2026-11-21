import "./apply_leave.css";
import BreadCrumb from "../breadcrumb/Breadcrumb";
import { useEffect, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import Alert, { type AlertProps } from "../common/alert/Alert";
import LabelAsterisk from "../common/LabelAsterisk";
import {
  getActiveLeaveTypes,
  type ActiveLeaveType,
} from "../services/leavetypesService";
import { postLeaveRequest } from "../services/leaveRequestsService";

type ApplyLeaveFormData = {
  leave_type: string;
  start_date: string;
  end_date: string;
  attachment: FileList;
  reason: string;
};

const formatDateInputValue = (year: number, month: number, day: number) => {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
};

const getFiscalYearDateBounds = (today = new Date()) => {
  const year = today.getFullYear();
  const month = today.getMonth() + 1; // 1-12

  // Jan–Mar: Apr 1 last year → Mar 31 this year
  // Apr–Dec: Apr 1 this year → Mar 31 next year
  if (month <= 3) {
    return {
      minDate: formatDateInputValue(year - 1, 4, 1),
      maxDate: formatDateInputValue(year, 3, 31),
    };
  }

  return {
    minDate: formatDateInputValue(year, 4, 1),
    maxDate: formatDateInputValue(year + 1, 3, 31),
  };
};

const ALLOWED_ATTACHMENT_EXTENSIONS = ["pdf", "jpg", "png"] as const;
const ATTACHMENT_ACCEPT = ".pdf,.jpg,.png";

const isAllowedAttachment = (file: File) => {
  const extension = file.name.split(".").pop()?.toLowerCase();
  return Boolean(
    extension &&
      ALLOWED_ATTACHMENT_EXTENSIONS.includes(
        extension as (typeof ALLOWED_ATTACHMENT_EXTENSIONS)[number]
      )
  );
};

const ApplyLeave = () => {
  const { register, handleSubmit, reset, watch, trigger, setValue, formState } =
    useForm<ApplyLeaveFormData>();
  const [leaveTypes, setLeaveTypes] = useState<ActiveLeaveType[]>([]);
  const [isLoadingLeaveTypes, setIsLoadingLeaveTypes] = useState(true);
  const [alertProps, setAlertProps] = useState<AlertProps | null>(null);
  const [alertKey, setAlertKey] = useState(0);

  const { minDate, maxDate } = getFiscalYearDateBounds();
  const selectedLeaveTypeId = watch("leave_type");
  const startDate = watch("start_date");
  const selectedLeaveType = leaveTypes.find(
    (leaveType) => String(leaveType.id) === selectedLeaveTypeId
  );
  const requiresAttachment = selectedLeaveType?.requires_attachment ?? false;
  const endDateMin = startDate && startDate > minDate ? startDate : minDate;

  const showAlert = (props: AlertProps) => {
    setAlertProps(props);
    setAlertKey((key) => key + 1);
  };

  useEffect(() => {
    const fetchLeaveTypes = async () => {
      setIsLoadingLeaveTypes(true);
      try {
        const response = await getActiveLeaveTypes();
        setLeaveTypes(response.data.leave_types);
      } catch (error) {
        showAlert({
          type: "danger",
          text:
            error instanceof Error ? error.message : "Something went wrong.",
        });
      } finally {
        setIsLoadingLeaveTypes(false);
      }
    };

    fetchLeaveTypes();
  }, []);

  useEffect(() => {
    trigger("attachment");
  }, [requiresAttachment, trigger]);

  useEffect(() => {
    trigger("end_date");
  }, [startDate, trigger]);

  const handleAttachmentChange = (
    event: ChangeEvent<HTMLInputElement>,
    onChange: (event: ChangeEvent<HTMLInputElement>) => void
  ) => {
    const file = event.target.files?.[0];
    if (file && !isAllowedAttachment(file)) {
      event.target.value = "";
      setValue("attachment", undefined as unknown as FileList, {
        shouldValidate: true,
      });
      showAlert({
        type: "danger",
        text: "Only PDF, JPG, and PNG files are allowed.",
      });
      return;
    }

    onChange(event);
  };

  const attachmentRegister = register("attachment", {
    validate: (files) => {
      if (!files || files.length === 0) {
        return !requiresAttachment;
      }
      return isAllowedAttachment(files[0]);
    },
  });

  const handleApplyLeave = async (data: ApplyLeaveFormData) => {
    if (
      requiresAttachment &&
      (!data.attachment || data.attachment.length === 0)
    ) {
      showAlert({
        type: "danger",
        text: "Document is required for this leave type.",
      });
      return;
    }

    if (data.attachment?.[0] && !isAllowedAttachment(data.attachment[0])) {
      showAlert({
        type: "danger",
        text: "Only PDF, JPG, and PNG files are allowed.",
      });
      return;
    }

    const formData = new FormData();
    formData.append("leave_type", data.leave_type);
    formData.append("start_date", data.start_date);
    formData.append("end_date", data.end_date);

    const trimmedReason = data.reason?.trim();
    if (trimmedReason) {
      formData.append("reason", trimmedReason);
    }

    if (data.attachment?.[0]) {
      formData.append("attachment", data.attachment[0]);
    }

    try {
      await postLeaveRequest(formData);
      reset();
      showAlert({
        type: "success",
        text: "Leave request submitted successfully.",
      });
    } catch (error) {
      showAlert({
        type: "danger",
        text: error instanceof Error ? error.message : "Something went wrong.",
      });
    }
  };

  return (
    <>
      {alertProps && <Alert key={alertKey} {...alertProps} />}

      <BreadCrumb title="Leave Application" path="Apply Leave" />

      <div className="leave_form_section">
        <h3> Application Form </h3>
        <form onSubmit={handleSubmit(handleApplyLeave)}>
          <div className="fields_container">
            <div className="field_container">
              <label htmlFor="leave_type">
                Leave Type <LabelAsterisk />
              </label>
              <select
                id="leave_type"
                disabled={isLoadingLeaveTypes}
                {...register("leave_type", { required: true })}
              >
                <option value="">
                  {isLoadingLeaveTypes
                    ? "Loading leave types..."
                    : "Select leave type"}
                </option>
                {leaveTypes.map((leaveType) => (
                  <option key={leaveType.id} value={leaveType.id}>
                    {leaveType.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field_container">
              <label htmlFor="start_date">
                Start Date <LabelAsterisk />
              </label>
              <input
                id="start_date"
                type="date"
                min={minDate}
                max={maxDate}
                {...register("start_date", {
                  required: true,
                  validate: (value) =>
                    Boolean(value) && value >= minDate && value <= maxDate,
                })}
              />
            </div>
            <div className="field_container">
              <label htmlFor="end_date">
                End date <LabelAsterisk />
              </label>
              <input
                id="end_date"
                type="date"
                min={endDateMin}
                max={maxDate}
                {...register("end_date", {
                  required: true,
                  validate: (value) =>
                    Boolean(value) &&
                    value >= endDateMin &&
                    value <= maxDate &&
                    (!startDate || value >= startDate),
                })}
              />
            </div>
            <div className="field_container">
              <label htmlFor="attachment">
                Upload Document {requiresAttachment && <LabelAsterisk />}
              </label>
              <input
                disabled={true}
                id="attachment"
                type="file"
                accept={ATTACHMENT_ACCEPT}
                style={{ background: "white" }}
                required={requiresAttachment}
                {...attachmentRegister}
                onChange={(event) =>
                  handleAttachmentChange(event, attachmentRegister.onChange)
                }
              />
            </div>
            <div className="field_container">
              <label htmlFor="reason"> Reason </label>
              <textarea id="reason" {...register("reason")} />
            </div>
            <button
              type="submit"
              className={`primary_btn ${
                (!formState.isValid ||
                  formState.isSubmitting ||
                  isLoadingLeaveTypes) &&
                "disabled"
              }`}
              disabled={
                !formState.isValid ||
                formState.isSubmitting ||
                isLoadingLeaveTypes
              }
            >
              {formState.isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default ApplyLeave;
