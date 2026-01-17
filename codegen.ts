import "dotenv/config";
import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  overwrite: true,
  schema: process.env.SALEOR_API_URL!,
  documents: "graphql/**/*.{ts,graphql}",
  generates: {
    "saleor/api.generated.ts": {
      plugins: [
        { add: { content: "// THIS FILE IS GENERATED WITH `yarn generate`" } },
        "typescript",
        "typescript-operations",
        "typescript-react-apollo",
        "typescript-apollo-client-helpers",
      ],
    },
    "graphql.schema.generated.json": {
      plugins: ["introspection"],
    },
  },
};

export default config;
