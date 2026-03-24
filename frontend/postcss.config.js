export default {
  plugins: {
    "@tailwindcss/postcss": {},
    "postcss-preset-env": {
      stage: 3,
      features: {
        "nesting-rules": true,
        "custom-properties": true,
        "custom-media-queries": true,
      },
      autoprefixer: {
        flexbox: "no-2009",
        grid: "autoplace",
      },
    },
    autoprefixer: {},
    ...(process.env.NODE_ENV === "production"
      ? {
          cssnano: {
            preset: [
              "default",
              {
                discardComments: {
                  removeAll: true,
                },
                normalizeWhitespace: true,
                minifyFontValues: true,
                minifyGradients: true,
              },
            ],
          },
        }
      : {}),
  },
};
