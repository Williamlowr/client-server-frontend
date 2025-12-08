"use client";

import { useState } from "react";

interface ServerResponse {
  fileSizeBytes: number;
  sha256: string;
  status: string;
  server: {
    fileSizeBytes: number;
    sha256: string;
  };
}

export default function Home() {
  const [status, setStatus] = useState("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [serverData, setServerData] = useState<ServerResponse | null>(null);
  const [clientHash, setClientHash] = useState<string | null>(null);
  const [hashMatch, setHashMatch] = useState<boolean | null>(null);

  // Utility to format bytes
  function formatBytes(bytes: number, decimals: number = 2) {
    if (bytes === 0) return "0 bytes";

    const k = 1024;
    const sizes = ["bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    const value = parseFloat((bytes / Math.pow(k, i)).toFixed(decimals));
    return `${value} ${sizes[i]}`;
  }

  // Utility to compute SHA-256 hash of a file
  async function hashFileSHA256(file: File) {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    return btoa(String.fromCharCode(...new Uint8Array(hashBuffer))); // Base64 like server
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || !files[0]) return;
    const file = files[0];

    setStatus("uploading");
    setServerData(null);
    setClientHash(null);
    setHashMatch(null);

    setPreview(URL.createObjectURL(file));

    // Compute client-side SHA-256 hash
    const localHash = await hashFileSHA256(file);
    setClientHash(localHash);

    const reader = new FileReader();
    reader.onload = async () => {
      if (!reader.result) return;
      const base64 = (reader.result as string).split(",")[1];

      const res = await fetch("/api/sendPhoto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileBase64: base64 }),
      });

      const json = await res.json();

      if (json.status === "confirmed") {
        setStatus("confirmed");
        setServerData(json.server);

        // Compare hashes
        const match = json.server.sha256 === localHash;
        setHashMatch(match);
      } else {
        setStatus("error");
      }
    };

    reader.readAsDataURL(file);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0d0d0d",
        color: "white",
        padding: "40px",
        fontFamily: "Inter, sans-serif",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        alignItems: "center",
      }}
    >
      {/* TITLE */}
      <h1 style={{ fontSize: "32px", fontWeight: "600", marginBottom: "5px" }}>
        TCP Server File Upload Demo
      </h1>

      {/* DESCRIPTION */}
      <p
        style={{
          textAlign: "center",
          maxWidth: "900px",
          lineHeight: "1.5",
          opacity: 0.85,
          fontSize: "16px",
          marginBottom: "10px",
        }}
      >
        This live demo uploads a file from your browser, uses an API route to a
        Railway-hosted Java TCP Server. The Java server receives the raw bytes
        over TCP, verifies the size, computes a SHA-256 hash, and returns the
        results.
      </p>

      {/* MAIN GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "25px",
          width: "100%",
          maxWidth: "1200px",
        }}
      >
        {/* CLIENT PANEL */}
        <div
          style={{
            background: "#1a1a1a",
            border: "1px solid #333",
            padding: "25px",
            borderRadius: "10px",
          }}
        >
          <h2 style={{ marginBottom: "10px" }}>Upload Image (User)</h2>
          <p style={{ marginBottom: "5px", opacity: 0.8 }}>
            Choose an image to send through the full TCP pipeline:
          </p>
          <p style={{ marginBottom: "15px", opacity: 0.8 }}>
            (Image will not be stored; only processed and verified by server)
          </p>

          {/* CUSTOM FILE BUTTON */}
          <label
            style={{
              background: "#222",
              padding: "12px 18px",
              borderRadius: "6px",
              border: "1px solid #444",
              cursor: "pointer",
              display: "inline-block",
              marginBottom: "10px",
            }}
          >
            Browse Files...
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              style={{ display: "none" }}
            />
          </label>

          <p style={{ marginTop: "15px" }}>
            <strong>Your Hash:</strong>
          </p>
          <code
            style={{
              display: "block",
              marginTop: "5px",
              padding: "10px",
              background: "#000",
              borderRadius: "8px",
              border: "1px solid #222",
              fontSize: "14px",
              whiteSpace: "break-word",
            }}
          >
            {clientHash}
          </code>

          {/* STATUS OUTPUT */}
          {status === "uploading" && (
            <p style={{ color: "yellow", marginTop: "10px" }}>
              Sending to Java TCP server… Please wait.
            </p>
          )}

          {status === "confirmed" && (
            <p style={{ color: "#5CFF5C", marginTop: "10px" }}>
              Server confirmed file!
            </p>
          )}

          {status === "error" && (
            <p style={{ color: "red", marginTop: "10px" }}>
              Error communicating with server.
            </p>
          )}
        </div>

        {/* SERVER PANEL */}
        <div
          style={{
            background: "#1a1a1a",
            border: "1px solid #333",
            padding: "25px",
            borderRadius: "10px",
          }}
        >
          <h2>Server Response (Java)</h2>

          {/* PREVIEW */}
          {preview && (
            <>
              <p style={{ marginTop: "10px", opacity: 0.8 }}>User's preview:</p>
              <img
                src={preview}
                alt="Preview"
                style={{
                  width: "100%",
                  maxHeight: "350px",
                  objectFit: "contain",
                  border: "1px solid #222",
                  borderRadius: "8px",
                  marginTop: "10px",
                }}
              />
            </>
          )}

          {/* STATUS */}
          {status === "confirmed" && (
            <p style={{ marginTop: "15px", color: "#5CFF5C" }}>
              Java server successfully processed the file!
            </p>
          )}

          {status === "uploading" && (
            <p style={{ marginTop: "15px", color: "yellow" }}>
              Waiting for server response…
            </p>
          )}

          {/* SERVER DATA */}
          {serverData && (
            <div
              style={{
                marginTop: "20px",
                padding: "15px",
                border: "1px solid #333",
                background: "#111",
                borderRadius: "8px",
              }}
            >
              <h3 style={{ marginBottom: "10px" }}>Server Verification</h3>

              <p>
                <strong>File Size Received:</strong>{" "}
                {formatBytes(serverData.fileSizeBytes)}
              </p>

              <p style={{ marginTop: "10px" }}>
                <strong>Server Hash:</strong>
              </p>
              <code
                style={{
                  display: "block",
                  marginTop: "5px",
                  padding: "10px",
                  background: "#000",
                  borderRadius: "8px",
                  border: "1px solid #222",
                  fontSize: "14px",
                  whiteSpace: "break-word",
                }}
              >
                {serverData.sha256}
              </code>

              <p style={{ marginTop: "15px" }}>
                <strong>SHA-256 Match?:</strong>{" "}
                {hashMatch === null
                  ? "—"
                  : hashMatch
                  ? "MATCHED; data intact"
                  : "MISMATCH (data corrupted)"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
