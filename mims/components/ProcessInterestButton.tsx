"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ProcessInterestResponse = {
  message: string;
  creditsCreated: number;
  totalInterest: number;
};

export function ProcessInterestButton() {
  const router = useRouter();

  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ProcessInterestResponse | null>(null);
  const [error, setError] = useState("");

  async function processInterest() {
    setProcessing(true);
    setResult(null);
    setError("");

    try {
      const response = await fetch("/api/interest/process", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Interest processing failed.");
      }

      setResult({
        message: data.message,
        creditsCreated: Number(data.creditsCreated ?? 0),
        totalInterest: Number(data.totalInterest ?? 0),
      });

      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Interest processing failed.",
      );
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div style={{ marginTop: 16 }}>
      <button
        type="button"
        className="btn"
        disabled={processing}
        onClick={processInterest}
      >
        {processing ? "Processing..." : "Process monthly interest"}
      </button>

      {result && (
        <div className="success" style={{ marginTop: 16 }}>
          <strong>{result.message}</strong>

          <p style={{ marginBottom: 4 }}>
            Credits created: {result.creditsCreated.toLocaleString()}
          </p>

          <p style={{ marginBottom: 0 }}>
            Total interest: LKR{" "}
            {result.totalInterest.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
      )}

      {error && (
        <p className="error" style={{ marginTop: 16 }}>
          {error}
        </p>
      )}
    </div>
  );
}
