import "./globals.css";
import { AuthProvider } from "./context/AuthContext";

export const metadata = {
  title: "SplitWMe - Smart Split & 1-Click UPI Settlement",
  description: "Split expenses smartly and settle instantly with 1-click UPI & payment links",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark h-full">
      <body className="min-h-screen bg-[#060911] text-slate-100 antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
