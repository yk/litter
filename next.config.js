/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, options) => {
    config.plugins.push(
      new options.webpack.IgnorePlugin({
        resourceRegExp: /canvas/,
      })
    );

    // add jsonlines loader
    config.module.rules.push({
      test: /\.jsonl$/,
      loader: "jsonlines-loader",
      type: "javascript/auto",
    });

    return config;
  },
  redirects: async () => {
    return [
      {
        source: "/",
        destination: "/bye",
        permanent: false,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
      },
    ],
  },
};

module.exports = nextConfig;
