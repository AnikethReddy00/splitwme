import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import CursorSpotlight from "./components/CursorSpotlight";

export const metadata = {
  title: "SplitWMe - Smart Split & 1-Click UPI Settlement",
  description: "Split expenses smartly and settle instantly with 1-click UPI & payment links",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark h-full">
      <body className="min-h-screen bg-[#060b16] text-slate-100 antialiased selection:bg-sky-500/30 selection:text-sky-200 overflow-x-hidden relative">
        <CursorSpotlight />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
