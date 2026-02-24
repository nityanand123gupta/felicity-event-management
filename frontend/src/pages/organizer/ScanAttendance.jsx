import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import api from "../../api/axios";

import Container from "../../components/ui/Container";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";

export default function ScanAttendance() {
  const [result, setResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);

  const scannerRef = useRef(null);
  const scannerId = "qr-reader";

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const startScanner = async () => {
    setResult(null);
    setScanning(true);

    setTimeout(async () => {
      try {
        await initScanner({ facingMode: "environment" });
      } catch {
        try {
          await initScanner({ facingMode: "user" }); // fallback to front camera
        } catch {
          setResult({ success: false, message: "Camera access failed" });
          setScanning(false);
        }
      }
    }, 300);
  };

  const initScanner = async (cameraConfig) => {
    const html5QrCode = new Html5Qrcode(scannerId);
    scannerRef.current = html5QrCode;

    await html5QrCode.start(
      cameraConfig,
      { fps: 15, qrbox: { width: 300, height: 300 } },
      async (decodedText) => {
        await handleScan(decodedText);
        await html5QrCode.stop();
        setScanning(false);
      }
    );
  };

  const handleScan = async (decodedText) => {
    setLoading(true);
    setResult(null);

    let ticketId;
    try {
      const parsed = JSON.parse(decodedText);
      ticketId = parsed.ticketId;
    } catch {
      ticketId = decodedText;
    }

    try {
      const res = await api.post("/events/attendance/scan", { ticketId });
      setResult({ success: true, message: res.data.message });
    } catch (err) {
      setResult({
        success: false,
        message: err.response?.data?.message || "Scan failed",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 via-white to-indigo-50 min-h-screen">
      <Container>

        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl p-8 mb-10 shadow-lg text-center">
          <h1 className="text-3xl font-bold">QR Attendance Scanner</h1>
          <p className="mt-2 text-purple-100">
            Scan participant QR codes using camera.
          </p>
        </div>

        <Card className="max-w-xl mx-auto text-center">

          {/* Scanner */}
          <div id={scannerId} className="mt-6"></div>

          {!scanning && (
            <Button className="mt-4" onClick={startScanner}>
              Start Camera Scanner
            </Button>
          )}

          {loading && (
            <p className="mt-4 text-indigo-600">Processing scan...</p>
          )}

          {result && (
            <div
              className={`mt-6 p-4 rounded-lg text-sm font-medium ${
                result.success
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {result.message}
            </div>
          )}

        </Card>

      </Container>
    </div>
  );
}