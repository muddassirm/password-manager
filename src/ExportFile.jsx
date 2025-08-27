import React, { useState } from "react";
import CryptoJS from "crypto-js";

const ExportFile = ({ show, onClose, passwords }) => {
  const [exportKeyInput, setExportKeyInput] = useState("");
  const [exportFileName, setExportFileName] = useState("passwords_export.enc");

  if (!show) return null; // don’t render if not visible

  const handleExportConfirm = () => {
    if (!exportKeyInput) {
      alert("Please enter a master key.");
      return;
    }

    // Prepare JSON with all saved entries
    const exportData = passwords.map(item => ({
      site: item.site,
      username: item.username,
      password: item.password // already encrypted
    }));

    // Encrypt with AES
    const encryptedData = CryptoJS.AES.encrypt(
      JSON.stringify(exportData),
      exportKeyInput
    ).toString();

    // Save as .enc file
    const blob = new Blob([encryptedData], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", exportFileName || "passwords_export.enc");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Reset + close
    setExportKeyInput("");
    setExportFileName("passwords_export.enc");
    onClose();
  };

  return (
    <div
      className="modal"
      style={{
        display: "block",
        background: "rgba(0,0,0,0.5)",
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 1050
      }}
    >
      <div className="modal-dialog" style={{ margin: "10% auto", maxWidth: 400 }}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Export Passwords</h5>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label">Master Key</label>
              <input
                type="password"
                className="form-control"
                value={exportKeyInput}
                onChange={e => setExportKeyInput(e.target.value)}
                autoFocus
                autoComplete="new-password"
              />
            </div>
            <div className="mb-3">
              <label className="form-label">File Name</label>
              <input
                type="text"
                className="form-control"
                value={exportFileName}
                onChange={e => setExportFileName(e.target.value)}
                placeholder="passwords_export.enc"
              />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-success" onClick={handleExportConfirm}>
              Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportFile;
