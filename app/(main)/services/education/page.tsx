"use client";

import { Student } from "@phosphor-icons/react/dist/ssr";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import Header from "@/components/Header";

export default function EducationPage() {
  const router = useRouter();
  const [institution, setInstitution] = useState("");
  const [studentId, setStudentId] = useState("");
  const [amount, setAmount] = useState("");

  const handleSubmit = () => {
    if (!institution) { toast.error("Select your institution"); return; }
    if (studentId.length < 5) { toast.error("Enter a valid student ID"); return; }
    if (!amount || Number(amount) < 1000) { toast.error("Minimum payment is ₦1,000"); return; }
    toast.success("Education payment coming soon!");
  };

  return (
    <div className="page">
      <Header title="Education" showBack />
      <div style={{ marginTop: "1rem" }}>
        <div className="card" style={{ padding: "1.5rem", textAlign: "center", marginBottom: "1.5rem" }}>
          <Student size={32} weight="duotone" color="var(--color-primary)" />
          <h3 style={{ marginTop: "0.75rem" }}>Pay School Fees & Exam Registrations</h3>
          <p style={{ fontSize: "0.8125rem", marginTop: "0.25rem" }}>
            Pay tuition, acceptance fees, and more at partner institutions.
          </p>
        </div>
        <button className="btn btn-primary btn-full" onClick={handleSubmit} style={{ height: 48 }}>
          Get Started
        </button>
      </div>
    </div>
  );
}
