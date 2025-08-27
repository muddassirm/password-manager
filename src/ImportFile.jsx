import React, { useState } from "react";
import CryptoJS from "crypto-js";

const ImportFile = ({ onImport, showModal, onClose }) => {
    const [importKey, setImportKey] = useState("");
    const [file, setFile] = useState(null);
    const handleCloseModal = () => {
        setImportKey("");
        setFile(null);
        onClose()
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleImport = () => {
        if (!file || !importKey) {
            alert("Please select a file and enter the master key.");
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const encrypted = event.target.result;
                const bytes = CryptoJS.AES.decrypt(encrypted, importKey);
                const decrypted = bytes.toString(CryptoJS.enc.Utf8);
                if (!decrypted) throw new Error("Decryption failed");
                const data = JSON.parse(decrypted);
                if (Array.isArray(data)) {
                    onImport(data);
                    handleCloseModal();
                } else {
                    alert("Invalid file format.");
                }
            } catch (err) {
                alert("Failed to import: " + err.message);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="mb-3">
            {showModal && (
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
                    <div
                        className="modal-dialog"
                        style={{ margin: "10% auto", maxWidth: 400 }}
                    >
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Import Passwords</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    aria-label="Close"
                                    onClick={handleCloseModal}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">Select File</label>
                                    <input
                                        type="file"
                                        accept=".enc,.json,.txt"
                                        className="form-control"
                                        onChange={handleFileChange}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Master Key</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        placeholder="Master Key"
                                        value={importKey}
                                        onChange={e => setImportKey(e.target.value)}
                                        autoComplete="new-password"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={handleCloseModal}>
                                    Cancel
                                </button>
                                <button className="btn btn-success" onClick={handleImport}>
                                    Import
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImportFile;
