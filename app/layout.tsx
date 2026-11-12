import "./globals.css"
import { Toaster } from "sonner"
export const metadata = { title: "museboard" }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="top-center" duration={2500} richColors />
      </body>
    </html>
  )
}
