
import { verifyFirebaseToken } from "./_firebaseAdmin.js";

const GROQ_ENDPOINT =
  "https://api.groq.com/openai/v1/chat/completions";

const DEFAULT_MODEL = "openai/gpt-oss-120b";

const MAX_PROMPT_LENGTH = 6000;
const MAX_FILES = 40;
const MAX_FILE_SIZE = 500000;
const MAX_TOTAL_SIZE = 4000000;
const MAX_COMPLETION_TOKENS = 65536;
const REQUEST_TIMEOUT = 180000;
const MAX_ATTEMPTS = 2;

/* =========================================
   ATLAS AI DESIGN ENGINE
========================================= */

const SYSTEM_PROMPT = `
You are ATLAS AI, an elite AI web application architect,
professional UI/UX designer, creative director and full-stack engineer.

Your mission is to turn ANY reasonable user idea into a beautiful,
complete, functional, professional multi-file web application.

You are NOT a basic HTML generator.
You are NOT a generic template filler.
You must never produce lazy, unfinished or visually boring applications.

==================================================
1. DESIGN EXCELLENCE IS MANDATORY
==================================================

Every application must have a deliberate visual identity.

A short user prompt does not mean a simple or low-quality result.

Example:
"Build a coffee shop website"

Create a complete premium coffee brand experience with:
- Distinctive brand identity.
- Beautiful navigation.
- Impressive hero section.
- High-quality relevant imagery.
- Attractive menu.
- Brand story.
- Location and contact sections.
- Clear calls to action.
- Beautiful footer.
- Responsive mobile experience.

Example:
"Build a finance dashboard"

Create:
- Professional dashboard layout.
- Beautiful navigation.
- Financial summary cards.
- Charts and graphs.
- Transaction history.
- Search and filters.
- Useful controls.
- Responsive layouts.
- Empty and loading states.

Infer sensible missing details yourself.
Do not ask the user to design the application for you.

==================================================
2. DESIGN THINKING
==================================================

Before coding, internally identify:

- Application category.
- Target audience.
- Product purpose.
- Appropriate visual direction.
- Colour palette.
- Typography.
- Layout structure.
- Required pages and sections.
- Important interactions.
- Mobile experience.

Do not output this analysis.

Use it to create the application.

==================================================
3. VISUAL STYLE
==================================================

Avoid generic browser-default designs.

Do not generate:
- Plain unstyled white pages.
- Default browser buttons.
- Random layouts.
- Poor typography.
- Inconsistent spacing.
- Unnecessary empty space.
- Generic repeated cards.
- Unfinished sections.
- Broken images.
- Fake interactive controls.

Light themes are allowed when appropriate, but they must
still look intentionally designed and visually polished.

Use:
- Beautiful colour palettes.
- CSS design tokens.
- Strong typography hierarchy.
- Carefully selected fonts.
- Consistent spacing.
- Attractive buttons.
- Beautiful cards.
- Subtle gradients.
- Refined shadows.
- Elegant borders.
- Appropriate border radii.
- Smooth transitions.
- Clear visual hierarchy.
- High-quality responsive layouts.

Do not use the same design for every application.

A fashion store, gaming platform, finance dashboard,
restaurant and portfolio must have distinct identities.

==================================================
4. PRODUCT-SPECIFIC DESIGN
==================================================

Choose the visual direction based on the product.

SAAS:
Premium business interface, refined typography, elegant
dashboards and professional layouts.

FINANCE:
Trustworthy colours, clear figures, organized transactions
and excellent data visualization.

ECOMMERCE:
Beautiful product imagery, product cards, filters,
search, shopping cart and purchase interactions.

RESTAURANT:
Appetizing imagery, attractive menu, brand storytelling
and prominent ordering actions.

PORTFOLIO:
Distinctive personal identity, creative layouts,
project showcases and expressive typography.

GAMING:
Immersive visuals, bold typography, rich graphics
and energetic interactions.

EDUCATION:
Clear learning hierarchy, course cards, progress
indicators and organized lessons.

SOCIAL:
Profiles, feeds, messaging, interaction controls
and responsive navigation.

TRAVEL:
Beautiful destinations, booking interfaces,
search and itinerary sections.

HEALTH:
Calm colours, accessible controls, clear information
and trustworthy appointment interfaces.

These are directions, not fixed templates.
Create original designs that fit the user's actual request.

==================================================
5. COMPLETE USER EXPERIENCE
==================================================

Do not build only a hero section.

For marketing websites, consider:
- Navigation.
- Hero.
- Features.
- Benefits.
- Product or service showcase.
- Testimonials when appropriate.
- Pricing when appropriate.
- FAQ when appropriate.
- Contact or conversion section.
- Footer.

For dashboards, consider:
- Sidebar or navigation.
- Header.
- Overview.
- Metrics.
- Charts.
- Tables and lists.
- Filters.
- Search.
- Account controls.
- Empty and loading states.

For applications, implement the actual user workflow:
- Navigation.
- Forms.
- Validation.
- Interactive components.
- Relevant screens.
- Feedback states.
- Responsive layouts.

Only include sections that make sense.

==================================================
6. IMAGES AND ASSETS
==================================================

Use relevant attractive imagery whenever it improves the design.

You may use appropriate remote images from reliable sources
such as images.unsplash.com.

Images must match the content.

Use:
- Proper aspect ratios.
- object-fit: cover.
- Meaningful alt text.
- Attractive image containers.
- Appropriate overlays.
- Sensible fallbacks.

Never use unrelated imagery to fill space.

If an image cannot be supplied, use an attractive CSS visual
instead of showing a broken image.

Do not invent local image files that are not included.

Do not output binary data.

==================================================
7. TYPOGRAPHY AND LAYOUT
==================================================

Typography must be intentional.

Use appropriate web fonts when useful.
Google Fonts may be loaded through valid external URLs.

Use:
- Strong heading hierarchy.
- Readable body text.
- Consistent font weights.
- Good line heights.
- Proper text widths.
- Responsive font sizes.

Use modern CSS:
- Grid.
- Flexbox.
- clamp().
- minmax().
- Responsive containers.
- Media queries.

==================================================
8. RESPONSIVE DESIGN
==================================================

Every application must support:
- Mobile.
- Tablet.
- Desktop.
- Large screens.

Do not merely shrink desktop layouts.

Create a proper mobile experience.

Test the layout mentally at:
360px, 390px, 768px, 1024px and 1440px.

Mobile navigation, buttons, forms, cards, tables and
modals must remain usable.

==================================================
9. ANIMATIONS AND INTERACTIONS
==================================================

Use subtle, purposeful animations.

Examples:
- Hover effects.
- Button feedback.
- Card transitions.
- Modal animations.
- Navigation transitions.
- Loading indicators.
- Smooth mobile menus.

Respect prefers-reduced-motion.

Every visible interactive element must perform its intended action.

Implement requested:
- Navigation.
- Search.
- Filters.
- Forms.
- Validation.
- Modals.
- Menus.
- Tabs.
- Dropdowns.
- Buttons.
- Application workflows.

Do not create fake buttons.
Do not use alert() as a replacement for a proper interface.
Do not simulate successful backend operations.

==================================================
10. REAL BACKEND
==================================================

If the application requires a backend, generate the necessary files.

Possible structure:

server.js
api/
routes/
controllers/
middleware/
config/

Never expose private API keys in browser JavaScript.

Use environment variables for secrets.

If credentials are missing:
- Implement integrations safely.
- Document required environment variables.
- Explain configuration in README.
- Do not claim services are already connected.

Never invent database records or fake API responses.

==================================================
11. MULTI-FILE PROJECT
==================================================

You are generating a REAL MULTI-FILE PROJECT.

Never put the entire application in index.html.

Every standard project must contain:

index.html
styles.css
script.js
manifest.webmanifest
service-worker.js
package.json
README.md

Add more files when required.

Example:

src/
  components/
  pages/
  styles/
  utils/

public/
  assets/
  icons/

api/
  routes/

server.js

Keep source files separate and use consistent file references.

Do not create empty files or unnecessary files.

==================================================
12. PWA
==================================================

Include a valid manifest.webmanifest with:

- name
- short_name
- description
- start_url
- display
- theme_color
- background_color
- icons

Include service-worker.js with sensible caching and
offline fallback behaviour.

Do not cache private API responses or sensitive data.

Include service worker registration where appropriate.

Do not claim installability if required assets are missing.

If icon image files cannot be generated, document the required
assets and use appropriate icon paths.

==================================================
13. ACCESSIBILITY
==================================================

Use:
- Semantic HTML.
- Accessible labels.
- Keyboard-friendly controls.
- Visible focus states.
- Appropriate ARIA attributes.
- Good colour contrast.
- Form validation.
- Useful error messages.
- Loading states.
- Empty states.

Avoid unnecessary dependencies.

==================================================
14. FINAL QUALITY REVIEW
==================================================

Before returning the project, internally check:

- Does the design fit the product?
- Is the first screen impressive?
- Is the visual identity coherent?
- Are the colours attractive?
- Is typography professional?
- Is spacing consistent?
- Is the mobile layout usable?
- Are requested features implemented?
- Do buttons work?
- Are file references correct?
- Is package.json valid?
- Is the manifest valid JSON?
- Is the service worker sensible?
- Are there syntax errors?
- Are there fake backend claims?
- Are there unfinished placeholders?

Improve the project before returning it.

==================================================
15. JSON OUTPUT
==================================================

Return exactly ONE valid JSON object.

Required structure:

{
  "projectName": "Application Name",
  "description": "Short description",
  "files": {
    "index.html": "complete source code",
    "styles.css": "complete source code",
    "script.js": "complete source code",
    "manifest.webmanifest": "complete manifest",
    "service-worker.js": "complete source code",
    "package.json": "complete package configuration",
    "README.md": "complete documentation"
  }
}

Additional files may use nested paths:

"src/components/Header.js": "complete source code"

JSON RULES:

- Valid JSON only.
- No Markdown code fences.
- No explanations outside JSON.
- Escape newlines and quotation marks.
- Every file must contain complete source code.
- Never write "rest of code here".
- Never write "implement this later".
- Never return placeholder file contents.
- Never include binary data.
- Never include private secrets.

Priorities:
1. Correct functionality.
2. Exceptional visual design.
3. Complete experience.
4. Responsive behaviour.
5. Clean architecture.
6. Maintainable code.

Build something that makes the user excited to explore it.
`;

/* =========================================
   HELPERS
========================================= */

function sendJSON(res, status, data) {
  return res.status(status).json(data);
}

function cleanText(value, fallback, maxLength) {
  if (typeof value !== "string") return fallback;

  const cleaned = value.trim().slice(0, maxLength);

  return cleaned || fallback;
}

function validateFilePath(path) {
  if (typeof path !== "string") return false;

  if (
    !path ||
    path.length > 180 ||
    path.startsWith("/") ||
    path.includes("\\") ||
    path.includes("\0")
  ) {
    return false;
  }

  const parts = path.split("/");

  return parts.every(part =>
    part &&
    part !== "." &&
    part !== ".." &&
    /^[a-zA-Z0-9._-]+$/.test(part)
  );
}

function parseAIJSON(content) {
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("The AI returned an empty project.");
  }

  let text = content.trim();

  text = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");

  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");

  if (first === -1 || last === -1 || last <= first) {
    throw new Error("The AI did not return a valid JSON project.");
  }

  return JSON.parse(text.slice(first, last + 1));
}

/* =========================================
   FILE VALIDATION
========================================= */

function validateProjectFiles(project) {
  if (
    !project ||
    typeof project !== "object" ||
    !project.files ||
    typeof project.files !== "object" ||
    Array.isArray(project.files)
  ) {
    throw new Error("The AI response is missing the project files.");
  }

  const entries = Object.entries(project.files);

  if (entries.length === 0 || entries.length > MAX_FILES) {
    throw new Error(
      `A project must contain between 1 and ${MAX_FILES} files.`
    );
  }

  const files = {};
  let totalSize = 0;

  for (const [path, content] of entries) {
    if (!validateFilePath(path)) {
      throw new Error(`Invalid generated file path: ${path}`);
    }

    if (typeof content !== "string") {
      throw new Error(`File ${path} does not contain text.`);
    }

    if (content.length > MAX_FILE_SIZE) {
      throw new Error(`File ${path} is too large.`);
    }

    totalSize += Buffer.byteLength(content, "utf8");

    if (totalSize > MAX_TOTAL_SIZE) {
      throw new Error("The generated project is too large.");
    }

    files[path] = content;
  }

  const requiredFiles = [
    "index.html",
    "styles.css",
    "script.js",
    "manifest.webmanifest",
    "service-worker.js",
    "package.json",
    "README.md"
  ];

  for (const file of requiredFiles) {
    if (!files[file]) {
      throw new Error(`The generated project is missing ${file}.`);
    }
  }

  // Validate manifest JSON.
  try {
    JSON.parse(files["manifest.webmanifest"]);
  } catch {
    throw new Error("The generated PWA manifest contains invalid JSON.");
  }

  // Validate package.json.
  try {
    const pkg = JSON.parse(files["package.json"]);

    if (!pkg || typeof pkg !== "object" || Array.isArray(pkg)) {
      throw new Error();
    }
  } catch {
    throw new Error("The generated package.json contains invalid JSON.");
  }

  return files;
}

/* =========================================
   PREVIEW BUILDER
========================================= */

function createPreviewHTML(files) {
  let html = files["index.html"];

  const css = files["styles.css"] || "";
  const js = files["script.js"] || "";

  // Inline main stylesheet.
  if (css) {
    const styleTag = `<style>\n${css}\n</style>`;

    if (/<\/head>/i.test(html)) {
      html = html.replace(
        /<\/head>/i,
        `${styleTag}\n</head>`
      );
    } else {
      html = styleTag + html;
    }
  }

  // Remove only the local root stylesheet.
  html = html.replace(
    /<link\b(?=[^>]*href=["'](?:\.\/)?styles\.css(?:\?[^"']*)?["'])[^>]*>/gi,
    ""
  );

  // Inline classic root script.
  const hasModuleScript =
    /<script\b[^>]*type=["']module["'][^>]*>/i.test(html);

  if (!hasModuleScript && js) {
    html = html.replace(
      /<script\b(?=[^>]*src=["'](?:\.\/)?script\.js(?:\?[^"']*)?["'])[^>]*>\s*<\/script>/gi,
      ""
    );

    const scriptTag = `<script>\n${js}\n</script>`;

    if (/<\/body>/i.test(html)) {
      html = html.replace(
        /<\/body>/i,
        `${scriptTag}\n</body>`
      );
    } else {
      html += scriptTag;
    }
  }

  // Service workers cannot be registered from Blob previews.
  html = html.replace(
    /navigator\.serviceWorker\.register\s*\(\s*(['"`])[^'"`]*\1\s*(?:,\s*\{[^}]*\})?\s*\)\s*;?/g,
    "/* Service worker registration is enabled on deployed HTTPS builds. */"
  );

  return html;
}

/* =========================================
   GROQ REQUEST
========================================= */

async function requestGroq({
  groqKey,
  model,
  projectName,
  projectId,
  prompt,
  attempt,
  signal
}) {
  const retryInstruction = attempt > 1
    ? `
IMPORTANT RETRY:
Your previous response failed JSON generation or validation.

Generate the complete project again.
Use concise but complete source code.
Do not omit required files.
Ensure every JSON string is correctly escaped.
Return one complete valid JSON object.
Do not include Markdown.
`
    : "";

  const response = await fetch(GROQ_ENDPOINT, {
    method: "POST",

    headers: {
      Authorization: `Bearer ${groqKey}`,
      "Content-Type": "application/json"
    },

    body: JSON.stringify({
      model,

      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user",
          content: `
APPLICATION NAME:
${projectName}

PROJECT ID:
${projectId || "New project"}

USER REQUIREMENTS:
${prompt}

GENERATION INSTRUCTIONS:

Treat the user requirements as the product specification.

If the prompt is short, intelligently infer missing details.
Do not ask the user to design the interface.

Choose a unique visual identity appropriate to the product.
Make the first screen visually impressive.
Build a complete and useful application experience.
Use relevant imagery and polished visual components.
Implement real interactions.
Generate separate source files.
Include all seven required standard files.

Do not return a generic starter template.
Do not return a plain unstyled page.
Do not reduce quality because the prompt is short.

${retryInstruction}

Return valid JSON only.
`
        }
      ],

      temperature: 0.55,

      // GPT-OSS uses max_completion_tokens.
      max_completion_tokens: MAX_COMPLETION_TOKENS,

      reasoning_effort: "low",

      include_reasoning: false,

      response_format: {
        type: "json_object"
      },

      stream: false
    }),

    signal
  });

  const result = await response.json().catch(() => ({}));

  return {
    response,
    result
  };
}

/* =========================================
   MAIN HANDLER
========================================= */

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");

    return sendJSON(res, 405, {
      success: false,
      error: "Method not allowed. Use POST."
    });
  }

  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");

  const groqKey = process.env.GROQ_API_KEY;

  if (!groqKey) {
    return sendJSON(res, 500, {
      success: false,
      error: "GROQ_API_KEY is missing from Vercel environment variables."
    });
  }

  /* AUTHENTICATION */

  let user;

  try {
    user = await verifyFirebaseToken(req);
  } catch (error) {
    return sendJSON(res, error.status || 401, {
      success: false,
      error: error.message || "Authentication required."
    });
  }

  /* INPUT VALIDATION */

  const body = req.body || {};

  const prompt = cleanText(
    body.prompt,
    "",
    MAX_PROMPT_LENGTH
  );

  const projectName = cleanText(
    body.projectName,
    "Untitled application",
    80
  );

  const projectId =
    typeof body.projectId === "string"
      ? body.projectId.slice(0, 150)
      : null;

  if (!prompt) {
    return sendJSON(res, 400, {
      success: false,
      error: "Please describe the application you want to build."
    });
  }

  if (
    typeof body.prompt === "string" &&
    body.prompt.length > MAX_PROMPT_LENGTH
  ) {
    return sendJSON(res, 400, {
      success: false,
      error: `Prompt cannot exceed ${MAX_PROMPT_LENGTH} characters.`
    });
  }

  /* AI CONFIGURATION */

  const model =
    process.env.GROQ_MODEL || DEFAULT_MODEL;

  const controller = new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT
  );

  try {
    let project = null;
    let files = null;
    let lastError = null;
    let lastProviderError = null;
    let usage = null;

    /* GENERATION WITH RETRY */

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      let response;
      let result;

      try {
        const request = await requestGroq({
          groqKey,
          model,
          projectName,
          projectId,
          prompt,
          attempt,
          signal: controller.signal
        });

        response = request.response;
        result = request.result;

      } catch (error) {
        if (error.name === "AbortError") {
          throw error;
        }

        console.error("Groq network error:", error);

        lastError = error;

        if (attempt < MAX_ATTEMPTS) {
          continue;
        }

        break;
      }

      if (!response.ok) {
        const providerError = result?.error || {};

        lastProviderError = {
          status: response.status,
          code: providerError.code || null,
          message: providerError.message || null
        };

        console.error("ATLAS GROQ ERROR:", {
          ...lastProviderError,
          failed_generation:
            providerError.failed_generation || null
        });

        lastError = new Error(
          providerError.message ||
          `Groq request failed (${response.status}).`
        );

        // Retry only JSON generation errors and temporary server errors.
        const retryable =
          providerError.code === "json_validate_failed" ||
          response.status >= 500;

        if (retryable && attempt < MAX_ATTEMPTS) {
          continue;
        }

        break;
      }

      const choice = result?.choices?.[0];
      const content = choice?.message?.content;

      usage = result?.usage || usage;

      if (!content) {
        lastError = new Error(
          "The AI provider returned no project content."
        );

        if (attempt < MAX_ATTEMPTS) {
          continue;
        }

        break;
      }

      if (choice.finish_reason === "length") {
        lastError = new Error(
          "The AI reached its completion-token limit before finishing the project."
        );

        if (attempt < MAX_ATTEMPTS) {
          continue;
        }

        break;
      }

      /* PARSE JSON */

      try {
        project = parseAIJSON(content);

        /* VALIDATE FILES */

        files = validateProjectFiles(project);

        lastError = null;

        break;

      } catch (error) {
        console.error(
          `ATLAS generation attempt ${attempt} failed:`,
          error.message
        );

        lastError = error;
        project = null;
        files = null;

        if (attempt >= MAX_ATTEMPTS) {
          break;
        }
      }
    }

    /* GENERATION FAILED */

    if (!files || !project) {
      return sendJSON(res, 502, {
        success: false,

        error:
          lastError?.message ||
          "The AI could not generate a valid project. Please try again.",

        providerCode:
          lastProviderError?.code || null,

        attempts: MAX_ATTEMPTS
      });
    }

    /* CREATE PREVIEW */

    let previewHtml;

    try {
      previewHtml = createPreviewHTML(files);
    } catch (error) {
      console.error("Preview creation failed:", error);

      return sendJSON(res, 502, {
        success: false,
        error: "Could not create the application preview."
      });
    }

    /* SUCCESS */

    return sendJSON(res, 200, {
      success: true,

      app: "ATLAS AI BUILDER",

      projectId,

      projectName: cleanText(
        project.projectName,
        projectName,
        80
      ),

      description: cleanText(
        project.description,
        "",
        500
      ),

      files,

      previewHtml,

      // Backward compatibility with current builder.js.
      code: previewHtml,

      fileCount: Object.keys(files).length,

      totalSize: Buffer.byteLength(
        JSON.stringify(files),
        "utf8"
      ),

      model,

      usage,

      attemptsUsed: MAX_ATTEMPTS,

      generatedAt: new Date().toISOString(),

      generatedBy: {
        uid: user.uid,
        email: user.email || null
      }
    });

  } catch (error) {
    console.error("ATLAS AI API error:", error);

    if (error.name === "AbortError") {
      return sendJSON(res, 504, {
        success: false,
        error: "AI generation timed out. Try a more focused request."
      });
    }

    return sendJSON(res, 500, {
      success: false,
      error: "An unexpected error occurred during project generation."
    });

  } finally {
    clearTimeout(timeout);
  }
}
