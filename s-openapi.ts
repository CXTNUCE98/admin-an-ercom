import { defineCommand, runMain } from "citty";
import { $fetch } from "ofetch";
import fs from "node:fs";
import path from "node:path";
import { objectMap } from "@antfu/utils";

const main = defineCommand({
  meta: {
    name: "s-openapi",
    version: "1.0.0",
    description: "Convert Swagger to JSON",
  },
  args: {
    url: {
      type: "positional",
      description: "Url",
      required: true,
    },
    covert: {
      type: "boolean",
      description: "Covert 2.0 to 3.0",
    },
    output: {
      type: "positional",
      description: "Output",
      required: true,
    },
  },
  async run({ args }) {
    const res = await $fetch(args.url);

    // Ensure directory exists
    const dir = path.dirname(args.output);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (args.covert) {
      const coverted = await $fetch(
        "https://converter.swagger.io/api/convert",
        { method: "POST", body: res }
      );
      const baseUrl = coverted.servers[0].url;
      const paths = objectMap(coverted.paths, (k, v) => [baseUrl + k, v]);
      coverted.paths = paths;
      fs.writeFileSync(args.output, JSON.stringify(coverted, null, 2));
    } else {
      fs.writeFileSync(args.output, JSON.stringify(res, null, 2));
    }
  },
});

runMain(main);
