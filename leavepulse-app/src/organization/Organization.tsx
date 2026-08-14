import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import BreadCrumb from "../breadcrumb/Breadcrumb";
import Alert, { type AlertProps } from "../common/alert/Alert";
import Modal from "../common/modal/Modal";
import { useAppContext } from "../context";
import {
  generateLeaveBalances,
  getOrganization,
  patchOrganization,
} from "../services/organizationService";
import "./organization.css";

type OrganizationFormData = {
  name: string;
};

const Organization = () => {
  const { currentUser } = useAppContext();
  const { register, handleSubmit, reset, formState } =
    useForm<OrganizationFormData>({
      defaultValues: { name: "" },
    });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLeaveBalanceGenerated, setIsLeaveBalanceGenerated] = useState(true);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [alertProps, setAlertProps] = useState<AlertProps | null>(null);
  const [alertKey, setAlertKey] = useState(0);

  const showAlert = (props: AlertProps) => {
    setAlertProps(props);
    setAlertKey((key) => key + 1);
  };

  useEffect(() => {
    const orgId = currentUser?.org_id;
    if (!orgId) {
      setIsLoading(false);
      showAlert({
        type: "danger",
        text: "Organization not found for the current user.",
      });
      return;
    }

    const fetchOrganization = async () => {
      try {
        const response = await getOrganization(orgId);
        reset({ name: response.data.organization.name });
        setIsLeaveBalanceGenerated(
          response.data.organization.is_leave_balance_generated
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

    fetchOrganization();
  }, [currentUser?.org_id, reset]);

  const handleSave = async (data: OrganizationFormData) => {
    const orgId = currentUser?.org_id;
    if (!orgId) return;

    try {
      const response = await patchOrganization(orgId, {
        name: data.name.trim(),
      });
      reset({ name: response.data.organization.name });
      setIsEditing(false);
      showAlert({
        type: "success",
        text: "Organization updated successfully.",
      });
    } catch (error) {
      showAlert({
        type: "danger",
        text: error instanceof Error ? error.message : "Something went wrong.",
      });
    }
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
  };

  const closeGenerateModal = () => {
    if (isGenerating) return;
    setIsGenerateModalOpen(false);
  };

  const handleGenerateLeaveBalances = async () => {
    const orgId = currentUser?.org_id;
    if (!orgId) return;

    setIsGenerating(true);
    try {
      const response = await generateLeaveBalances(orgId);
      setIsLeaveBalanceGenerated(
        response.data.organization?.is_leave_balance_generated ?? true
      );
      setIsGenerateModalOpen(false);
      showAlert({
        type: "success",
        text: "Leave balances generated successfully.",
      });
    } catch (error) {
      showAlert({
        type: "danger",
        text: error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveDisabled =
    !isEditing || !formState.isValid || formState.isSubmitting;

  return (
    <>
      {alertProps && <Alert key={alertKey} {...alertProps} />}

      <BreadCrumb title="Organization Module" path="My Org" />

      <div className="organization_form_section">
        <div className="organization_section_header">
          <h3>Organization Details</h3>
          {!isLoading && !isLeaveBalanceGenerated && (
            <button
              type="button"
              className="primary_btn"
              onClick={() => setIsGenerateModalOpen(true)}
            >
              Generate Leaves for this Year
            </button>
          )}
        </div>
        {isLoading ? (
          <p style={{ padding: "20px" }}>Loading...</p>
        ) : (
          <form
            className="organization_form"
            onSubmit={handleSubmit(handleSave)}
          >
            <div className="field_container">
              <label htmlFor="organization-name">Name</label>
              <input
                id="organization-name"
                type="text"
                readOnly={!isEditing}
                {...register("name", {
                  required: true,
                  validate: (value) => value.trim().length > 0,
                })}
              />
            </div>
            <div className="btn_container">
              {isEditing && (
                <button
                  type="button"
                  className="cancel_button"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              )}
              <div className="btn_actions">
                <button
                  type="button"
                  className="secondary_btn"
                  onClick={() => setIsEditing(true)}
                  disabled={isEditing}
                >
                  Edit
                </button>
                <button
                  type="submit"
                  className={`primary_btn ${saveDisabled ? "disabled" : ""}`}
                  disabled={saveDisabled}
                >
                  {formState.isSubmitting ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      <Modal
        isOpen={isGenerateModalOpen}
        onClose={closeGenerateModal}
        title="Generate Leave Balances"
      >
        <div className="organization_generate_modal">
          <p>
            Are you sure you want to generate leave balances for this year? This
            will create leave balances for all employees in the organization.
          </p>
          <div className="btn_container">
            <button
              type="button"
              className={`primary_btn ${isGenerating ? "disabled" : ""}`}
              onClick={handleGenerateLeaveBalances}
              disabled={isGenerating}
            >
              {isGenerating ? "Generating..." : "Confirm"}
            </button>
            <button
              type="button"
              className="cancel_button"
              onClick={closeGenerateModal}
              disabled={isGenerating}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Organization;
