import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata = {
  title: "SplitWMe — Split bills over UPI. Friends never install anything.",
  description: "One person collects, friends tap a link and pay by UPI with the exact amount prefilled. No app, no signup for payers. Free forever.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}>
      <body className="min-h-screen bg-[#ffffff] text-[#09090b] font-sans antialiased selection:bg-[#09090b] selection:text-[#ffffff] overflow-x-hidden">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
