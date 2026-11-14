import "./globals.css";

export const metadata = { title: "Computational Logistics leaderboard" };

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
