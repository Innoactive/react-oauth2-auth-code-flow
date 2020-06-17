import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";

const config = {
  input: "src/index.js",
  output: {
    dir: "dist",
    format: "cjs",
  },
  plugins: [
    babel({ babelHelpers: "bundled" }),
    resolve({ preferBuiltins: true }),
    commonjs(),
  ],
};

export default config;
