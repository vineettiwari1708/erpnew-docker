import { Font } from "@react-pdf/renderer";

// Roboto (full, not subsetted) includes the ₹ glyph that Helvetica lacks.
// Loaded once at module level; @react-pdf/renderer deduplicates registrations.
Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "https://cdn.jsdelivr.net/npm/roboto-fontface@0.10.0/fonts/roboto/Roboto-Regular.woff",
      fontWeight: "normal",
    },
    {
      src: "https://cdn.jsdelivr.net/npm/roboto-fontface@0.10.0/fonts/roboto/Roboto-Bold.woff",
      fontWeight: "bold",
    },
  ],
});
