import { useEffect, useRef, type ReactNode } from "react";
import "./modal.css";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  width?: number;
};

const Modal = ({ isOpen, onClose, title, children, width }: ModalProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    dialogRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal_overlay" onClick={onClose}>
      <div
        ref={dialogRef}
        className="modal_dialog"
        style={{ width: width ? `${width}px` : "500px" }}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal_header">
          {title && <h3>{title}</h3>}
          <button
            type="button"
            className="modal_close_btn"
            onClick={onClose}
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
