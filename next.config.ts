import type { NextConfig } from 'next'

const API_TARGET = (process.env.API_TARGET || 'https://market-analysis.pflabs.in').replace(/\/$/, '')

const nextConfig: NextConfig = {
  // The FastAPI app has no CORS middleware, so the browser talks to /api on
  // this origin and Next forwards it.
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_TARGET}/:path*` }]
  },
  experimental: {
    // Rewrites give up after 30s by default. Analyses run in the background,
    // but the brief check (an LLM call) and large uploads can take longer.
    proxyTimeout: 5 * 60 * 1000,
    // Forwarded request bodies are cut off at 10 MB by default, which hangs a
    // larger upload. The API accepts documents up to 20 MB.
    proxyClientMaxBodySize: '25mb',
    agentUpgrade: 'security',
  },
}

export default nextConfig
