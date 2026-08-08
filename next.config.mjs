import os from 'os';

function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  return ips;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['localhost', '127.0.0.1', 'clear-ravens-remain.loca.lt', ...getLocalIPs()],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'tqtgdmjjbifybworebnm.supabase.co',
      }
    ],
  },
};

export default nextConfig;
