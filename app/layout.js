import './globals.css';

export const metadata = {
  title: 'Systems',
  description: 'Set the time it takes, run the task.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
