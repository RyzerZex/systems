import './globals.css';
import ServiceWorkerRegister from './service-worker-register';

export const metadata = {
  title: 'Systems',
  description: 'Set the time it takes, run the task.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Systems',
  },
};

export const viewport = {
  themeColor: '#12151A',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
