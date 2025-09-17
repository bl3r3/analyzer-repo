// analizer.js
import fs from "fs";
import path from "path";
import { sync as globSync } from "glob";
import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
const traverse = _traverse.default;

// --- CONFIGURACIÓN ---
const PROJECT_DIR = "./src"; // Ruta relativa a la carpeta src de este proyecto de prueba
const LIBRARIES_TO_TRACK = ["@vetsource/kibble", "@mui/material"];

// Lista de importaciones que TIENEN permitido tener 0 usos (JSX)
// (Pre-poblada con los ejemplos de tu log)
const USAGE_ZERO_ALLOW_LIST = new Set([
  "styled",
  "createTheme",
  "ThemeOptions",
  "Components",
  "PaletteOptions",
  "useFormControl",
  "FormControlProps",
  "SelectChangeEvent",
  "StepIconProps",
  "UseAutocompleteProps",
  "AutocompleteInputChangeReason",
  "dialogClasses",
  "MenuProps",
  "StackProps",
  "BoxProps",
  "CardProps",
  "TextFieldProps",
  "useMediaQuery",
  "SelectChangeEvent",
  "StepIconProps",
  "ThemeOptions",
  "createTheme",
  "Components",
  "PaletteOptions",
  "buttonBaseClasses",
  "CircularProgressProps",
  "DividerProps",
  "FormHelperTextProps",
  "OutlinedInputProps",
  "SelectProps",
  "AlertColor",
  "TableContainerProps",
  "DialogProps",
  "DrawerProps",
  "PopoverOrigin",
  "PaginationProps",
  "ListItemButtonProps",
  "ListItemIconProps",
  "ListItemTextProps",
  "MenuItemProps",
]);

const stats = {};
LIBRARIES_TO_TRACK.forEach((lib) => (stats[lib] = {}));

// --- LÓGICA DE ANÁLISIS ---

function analyzeCode() {
  const filePaths = globSync(`${PROJECT_DIR}/**/*.{js,jsx,ts,tsx}`, {
    ignore: [
      "**/node_modules/**",
      "**/*.d.ts",
      "**/*.spec.*",
      "**/*.test.*",
      "**/analizer.js",
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
            stats[lib][original].files.add(filePath);
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
  let csvContent = "Library,Component,ImportCount,UsageCount,Files\n";
  Object.keys(report).forEach((lib) => {
    Object.keys(report[lib]).forEach((component) => {
      const data = report[lib][component];
      const fileList = [...data.files].join("; ");
      csvContent += `"${lib}","${component}",${data.imports},${data.usage},"${fileList}"\n`;
    });
  });
  try {
    fs.writeFileSync("component_report.csv", csvContent, "utf-8");
    console.log('Reporte "component_report.csv" generado con éxito.');
  } catch (error) {
    console.error("Error al guardar el archivo CSV:", error);
  }
}

function validateReport(report) {
  console.log("Validando reporte en busca de importaciones muertas...");
  const deadImportsFound = [];

  Object.keys(report).forEach((lib) => {
    Object.keys(report[lib]).forEach((componentName) => {
      const data = report[lib][componentName];
      if (data.usage === 0 && !USAGE_ZERO_ALLOW_LIST.has(componentName)) {
        deadImportsFound.push(
          `- ${lib}: ${componentName} (Importado ${data.imports} veces, usado 0)`
        );
      }
    });
  });

  if (deadImportsFound.length > 0) {
    console.error("------------------------------------------------------");
    console.error("¡ERROR: BUILD FALLIDO!");
    console.error(
      "Se encontraron los siguientes componentes importados pero NUNCA usados en JSX:"
    );
    deadImportsFound.forEach((line) => console.error(line));
    console.error("------------------------------------------------------");
    process.exit(1); // Falla el pipeline
  } else {
    console.log("Validación exitosa. No se encontraron importaciones muertas.");
  }
}

// --- EJECUCIÓN ---
analyzeCode();
generateSheet(stats);
validateReport(stats); // Validamos el resultado
console.log(stats);
