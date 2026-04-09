import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const { problemType, description } = await req.json();

    if (!problemType || !description) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const problemLabels: Record<string, string> = {
      camera: "Camera / Facial Recognition Not Working",
      attendance: "Incorrect Attendance Log (Marked Absent/Late)",
      dashboard: "Dashboard / Metrics Not Updating",
      student_profile: "Student Profile Data Error",
      system_crash: "System Crash or Freeze",
      other: "Other Issue",
    };

    const label = problemLabels[problemType] ?? problemType;
    const timestamp = new Date().toLocaleString("en-US", { timeZone: "Asia/Riyadh" });

    await transporter.sendMail({
      from: `"Smart Attendance AI" <${process.env.SMTP_USER}>`,
      to: "binjoharf@gmail.com",
      subject: `[Help Center] ${label}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
          <div style="background: #1e293b; padding: 24px 28px;">
            <h1 style="color: white; margin: 0; font-size: 20px;">📋 Help Center Report</h1>
            <p style="color: #94a3b8; margin: 4px 0 0; font-size: 13px;">Smart Attendance AI System</p>
          </div>
          <div style="padding: 28px;">
            <table style="width:100%; border-collapse:collapse;">
              <tr>
                <td style="padding: 8px 0; font-size: 13px; color: #64748b; font-weight: 600; width: 140px;">Problem Type</td>
                <td style="padding: 8px 0; font-size: 14px; color: #1e293b;">${label}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-size: 13px; color: #64748b; font-weight: 600;">Submitted At</td>
                <td style="padding: 8px 0; font-size: 14px; color: #1e293b;">${timestamp}</td>
              </tr>
            </table>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <h2 style="font-size: 14px; color: #64748b; font-weight: 600; margin: 0 0 10px;">Description</h2>
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; font-size: 14px; color: #334155; line-height: 1.6; white-space: pre-wrap;">${description}</div>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Email send error:", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
