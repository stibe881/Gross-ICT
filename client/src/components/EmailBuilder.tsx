import { useEffect, useRef } from "react";
import grapesjs, { Editor } from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import gjsPresetNewsletter from "grapesjs-preset-newsletter";

interface EmailBuilderProps {
  initialContent?: string;
  onChange?: (html: string, css: string) => void;
  onSave?: (html: string, css: string) => void;
}

export default function EmailBuilder({
  initialContent = "",
  onChange,
  onSave,
}: EmailBuilderProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const grapesjsEditor = useRef<Editor | null>(null);

  useEffect(() => {
    if (!editorRef.current || grapesjsEditor.current) return;

    const editor = grapesjs.init({
      container: editorRef.current,
      plugins: [gjsPresetNewsletter],
      pluginsOpts: {
        "gjs-preset-newsletter": {
          modalTitleImport: "Import Template",
          modalTitleExport: "Export Template",
          modalBtnImport: "Import",
          codeViewerTheme: "material",
          importPlaceholder: "Paste your HTML/CSS here",
          cellStyle: {
            padding: "0",
            margin: "0",
            "vertical-align": "top",
          },
        },
      },
      storageManager: false,
      height: "700px",
      width: "100%",
      panels: {
        defaults: [
          {
            id: "basic-actions",
            el: ".panel__basic-actions",
            buttons: [
              {
                id: "visibility",
                active: true,
                className: "btn-toggle-borders",
                label: '<i class="fa fa-clone"></i>',
                command: "sw-visibility",
              },
            ],
          },
          {
            id: "panel-devices",
            el: ".panel__devices",
            buttons: [
              {
                id: "device-desktop",
                label: '<i class="fa fa-desktop"></i>',
                command: "set-device-desktop",
                active: true,
                togglable: false,
              },
              {
                id: "device-mobile",
                label: '<i class="fa fa-mobile"></i>',
                command: "set-device-mobile",
                togglable: false,
              },
            ],
          },
        ],
      },
      deviceManager: {
        devices: [
          {
            name: "Desktop",
            width: "",
          },
          {
            name: "Mobile",
            width: "320px",
            widthMedia: "480px",
          },
        ],
      },
      blockManager: {
        blocks: [
          {
            id: "section",
            label: "Section",
            attributes: { class: "gjs-block-section" },
            content: `<table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 20px;">
                  <p>This is a section</p>
                </td>
              </tr>
            </table>`,
          },
          {
            id: "text",
            label: "Text",
            content: '<p style="padding: 10px;">Insert your text here</p>',
          },
          {
            id: "image",
            label: "Image",
            content: {
              type: "image",
              style: { width: "100%", "max-width": "600px" },
              attributes: { src: "https://via.placeholder.com/600x300" },
            },
          },
          {
            id: "button",
            label: "Button",
            content: `<table style="width: 100%;">
              <tr>
                <td style="text-align: center; padding: 20px;">
                  <a href="#" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                    Click Here
                  </a>
                </td>
              </tr>
            </table>`,
          },
          {
            id: "divider",
            label: "Divider",
            content: `<table style="width: 100%;">
              <tr>
                <td style="padding: 20px 0;">
                  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0;">
                </td>
              </tr>
            </table>`,
          },
        ],
      },
      canvas: {
        styles: [
          "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
        ],
      },
    });

    // Set initial content
    if (initialContent) {
      editor.setComponents(initialContent);
    }

    // Listen to changes
    editor.on("update", () => {
      const html = editor.getHtml() || "";
      const css = editor.getCss() || "";
      onChange?.(html, css);
    });

    // Save command
    editor.Commands.add("save-template", {
      run: () => {
        const html = editor.getHtml() || "";
        const css = editor.getCss() || "";
        onSave?.(html, css);
      },
    });

    grapesjsEditor.current = editor;

    return () => {
      if (grapesjsEditor.current) {
        grapesjsEditor.current.destroy();
        grapesjsEditor.current = null;
      }
    };
  }, []);

  // Update content when initialContent changes
  useEffect(() => {
    if (grapesjsEditor.current && initialContent) {
      grapesjsEditor.current.setComponents(initialContent);
    }
  }, [initialContent]);

  return (
    <div className="email-builder-wrapper">
      <style>{`
        .email-builder-wrapper {
          width: 100%;
          height: 100%;
        }
        .gjs-one-bg {
          background-color: #f9fafb;
        }
        .gjs-two-color {
          color: #1f2937;
        }
        .gjs-three-bg {
          background-color: #ffffff;
          color: #1f2937;
        }
        .gjs-four-color,
        .gjs-four-color-h:hover {
          color: #2563eb;
        }
        .gjs-block {
          width: auto;
          height: auto;
          min-height: 60px;
          padding: 10px;
          margin: 5px;
        }
        .gjs-block-label {
          font-size: 12px;
          font-weight: 500;
        }
        .panel__devices {
          position: absolute;
          top: 10px;
          right: 10px;
        }
        .panel__basic-actions {
          position: absolute;
          top: 10px;
          left: 10px;
        }
      `}</style>
      <div ref={editorRef} />
    </div>
  );
}
