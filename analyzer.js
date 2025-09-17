import fs from "fs";
import path from "path";
import { sync as globSync } from "glob";
import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
const traverse = _traverse.default;

// --- CONFIGURACIÓN ---
const PROJECT_DIR = "./src";
const LIBRARIES_TO_TRACK = ["@vetsource/kibble", "@mui/material"];

const stats = {};
LIBRARIES_TO_TRACK.forEach((lib) => (stats[lib] = {}));

function analyzeCode() {
  const filePaths = globSync(`${PROJECT_DIR}/**/*.{js,jsx,ts,tsx}`, {
    ignore: [
      "**/node_modules/**",
      "**/*.d.ts",
      "**/*.spec.*",
      "**/*.test.*",
      "**/analyzer.js",
    ],
  });

  console.log(`Analizando ${filePaths.length} archivos válidos...`);

  filePaths.forEach((filePath) => {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const ast = parse(content, {
        sourceType: "module",
        plugins: ["jsx", "typescript"],
      });

      const localImports = {};

      traverse(ast, {
        ImportDeclaration(path) {
          const libName = path.node.source.value;
          if (LIBRARIES_TO_TRACK.includes(libName)) {
            path.node.specifiers.forEach((specifier) => {
              if (specifier.type === "ImportSpecifier") {
                const importedName = specifier.imported.name;
                const localName = specifier.local.name;

                if (!stats[libName][importedName]) {
                  stats[libName][importedName] = {
                    imports: 0,
                    usage: 0,
                    files: new Set(),
                  };
                }

                stats[libName][importedName].imports += 1;

                stats[libName][importedName].files.add(filePath);

                localImports[localName] = {
                  lib: libName,
                  original: importedName,
                };
              }
            });
          }
        },
        JSXOpeningElement(path) {
          const nodeName = path.node.name.name;
          if (localImports[nodeName]) {
            const { lib, original } = localImports[nodeName];
            stats[lib][original].usage += 1;
          }
        },
      });
    } catch (error) {
      console.warn(
        `Error analizando ${filePath}: ${error.message}. Saltando archivo.`
      );
    }
  });

  console.log("Análisis completado.");
}

function generateSheet(report) {
  let csvContent = "Library,Component,ImportCount,UsageCount,isUsed,Files\n";

  Object.keys(report).forEach((lib) => {
    Object.keys(report[lib]).forEach((component) => {
      const data = report[lib][component];
      const fileList = [...data.files].join("; ");
      const isUsed = data.usage > 0 ? "Yes" : "No";

      csvContent += `"${lib}","${component}",${data.imports},${data.usage},"${isUsed}","${fileList}"\n`;
    });
  });

  try {
    fs.writeFileSync("component_report.csv", csvContent, "utf-8");
    console.log('Reporte "component_report.csv" generado con éxito.');
  } catch (error) {
    console.error("Error al guardar el archivo CSV:", error);
  }
}

// --- EJECUCIÓN ---
analyzeCode();
generateSheet(stats);
console.log(stats);
