import React, { useState, useEffect } from "react";
import CryptoJS from "crypto-js";
import Navbar from "./Navbar";
import ImportFile from "./ImportFile";
import ExportFile from './ExportFile'

const DB_NAME = "passwordManagerDB";
const STORE_NAME = "passwords";
const SECRET_KEY = "my-secret-key";

const PasswordManager = () => {
    const [passwords, setPasswords] = useState([]);
    const [site, setSite] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [validated, setValidated] = useState(false);

    useEffect(() => {
        const openRequest = indexedDB.open(DB_NAME, 1);

        openRequest.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: "id" });
            }
        };

        openRequest.onsuccess = () => {
            fetchPasswords();
        };
    }, []);

    const encryptPassword = (text) => {
        return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
    };

    const decryptPassword = (ciphertext) => {
        try {
            const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
            return bytes.toString(CryptoJS.enc.Utf8);
        } catch (error) {
            console.error("Decryption failed", error);
            return "Error";
        }
    };

    const fetchPasswords = () => {
        const openRequest = indexedDB.open(DB_NAME, 1);
        openRequest.onsuccess = () => {
            const db = openRequest.result;
            const transaction = db.transaction(STORE_NAME, "readonly");
            const store = transaction.objectStore(STORE_NAME);
            const getRequest = store.getAll();

            getRequest.onsuccess = () => {
                setPasswords(getRequest.result);
            };
        };
    };

    const getUniqueID = () => {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    };

    const addPassword = () => {
        setValidated(true);

        if (!site || !username || !password) {
            return; // stop if any field is empty
        }

        const encryptedPassword = encryptPassword(password);
        const newEntry = { id: getUniqueID(), site, username, password: encryptedPassword };

        const openRequest = indexedDB.open(DB_NAME, 1);
        openRequest.onsuccess = () => {
            const db = openRequest.result;
            const transaction = db.transaction(STORE_NAME, "readwrite");
            const store = transaction.objectStore(STORE_NAME);
            store.add(newEntry);
            transaction.oncomplete = fetchPasswords;
        };

        // Reset form
        setSite("");
        setUsername("");
        setPassword("");
        setValidated(false);
    };

    const deletePassword = (id) => {
        const openRequest = indexedDB.open(DB_NAME, 1);
        openRequest.onsuccess = () => {
            const db = openRequest.result;
            const transaction = db.transaction(STORE_NAME, "readwrite");
            const store = transaction.objectStore(STORE_NAME);
            store.delete(id);
            transaction.oncomplete = fetchPasswords;
        };
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };

    // 🔐 Secure Export Function (Default = .enc)
    const exportPasswords = () => {
        if (passwords.length === 0) {
            alert("No passwords to export!");
            return;
        }

        // Ask the user for a master password to secure the export
        const exportKey = prompt("Enter a password to secure your export file:");
        if (!exportKey) {
            alert("Export cancelled. You must provide a password.");
            return;
        }

        // Prepare JSON with all saved entries
        const exportData = passwords.map(item => ({
            site: item.site,
            username: item.username,
            password: item.password // stored already encrypted
        }));

        // Encrypt the JSON string with AES
        const encryptedData = CryptoJS.AES.encrypt(
            JSON.stringify(exportData),
            exportKey
        ).toString();

        // Save as .enc file
        const blob = new Blob([encryptedData], { type: "text/plain;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "passwords_export.enc");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };



    // Modal state
    const [showExportModal, setShowExportModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [exportKeyInput, setExportKeyInput] = useState("");
    const [exportFileName, setExportFileName] = useState("passwords_export.enc");

    // Modified export handler to use modal
    const handleExportClick = () => {
        if (passwords.length === 0) {
            alert("No passwords to export!");
            return;
        }
        setShowExportModal(true);
    };

    const handleImportClick = () => {
        setShowImportModal(true);
    };

    const handleExportConfirm = () => {
        if (!exportKeyInput) {
            alert("Please enter a master key.");
            return;
        }
        // Prepare JSON with all saved entries
        const exportData = passwords.map(item => ({
            site: item.site,
            username: item.username,
            password: item.password // stored already encrypted
        }));

        // Encrypt the JSON string with AES
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

        setShowExportModal(false);
        setExportKeyInput("");
        setExportFileName("passwords_export.enc");
    };

    const handleExportCancel = () => {
        setShowExportModal(false);
        setExportKeyInput("");
        setExportFileName("passwords_export.enc");
    };

    // Add import handler
    const handleImportPasswords = (importedData) => {
        // importedData is an array of {site, username, password}
        // Add unique IDs and store in IndexedDB
        const openRequest = indexedDB.open(DB_NAME, 1);
        openRequest.onsuccess = () => {
            const db = openRequest.result;
            const transaction = db.transaction(STORE_NAME, "readwrite");
            const store = transaction.objectStore(STORE_NAME);
            importedData.forEach(item => {
                const newEntry = {
                    id: getUniqueID(),
                    site: item.site,
                    username: item.username,
                    password: item.password
                };
                store.add(newEntry);
            });
            transaction.oncomplete = fetchPasswords;
        };
    };

    return (
        <div className="container mt-5">
            <div className="d-flex justify-content-start gap-2 my-5">
                <button className="btn btn-secondary" onClick={handleImportClick}>
                    <i className="bi bi-upload"></i> Import Passwords
                </button>
                <button className="btn btn-success" onClick={handleExportClick}>
                    <i className="bi bi-download"></i> Export Passwords
                </button>
            </div>

            <ImportFile onImport={handleImportPasswords}
                showModal={showImportModal}
                onClose={() => setShowImportModal(false)} 
            />

            <ExportFile
                show={showExportModal}
                onClose={() => setShowExportModal(false)}
                passwords={passwords}
            />

            <div className="mb-3 row g-2">
                <div className="col-12 col-md-3">
                    <input
                        type="text"
                        className={`form-control ${validated && !site ? "is-invalid" : ""}`}
                        placeholder="Website"
                        value={site}
                        onChange={(e) => setSite(e.target.value)}
                        autoComplete="off"
                        required
                    />
                    {validated && !site && (
                        <div className="invalid-feedback">Website is required.</div>
                    )}
                </div>
                <div className="col-12 col-md-3">
                    <input
                        type="text"
                        className={`form-control ${validated && !username ? "is-invalid" : ""}`}
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="off"
                        required
                    />
                    {validated && !username && (
                        <div className="invalid-feedback">Username is required.</div>
                    )}
                </div>
                <div className="col-12 col-md-3">
                    <input
                        type="password"
                        className={`form-control ${validated && !password ? "is-invalid" : ""}`}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        required
                    />
                    {validated && !password && (
                        <div className="invalid-feedback">Password is required.</div>
                    )}
                </div>
                <div className="col-12 col-md-3">
                    <button className="btn btn-primary w-100" onClick={addPassword}>
                        Add Password
                    </button>
                </div>
            </div>

            <table className="table table-bordered">
                <thead>
                    <tr>
                        <th>Website</th>
                        <th>Username</th>
                        <th>Password</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {passwords.map((item) => (
                        <tr key={item.id}>
                            <td>{item.site}</td>
                            <td>{item.username}</td>
                            <td>{item.password}</td>
                            <td>
                                <button
                                    className="btn btn-primary btn-sm me-2"
                                    onClick={() => copyToClipboard(decryptPassword(item.password))}
                                >
                                    Copy
                                </button>
                                <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => deletePassword(item.id)}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default PasswordManager;
