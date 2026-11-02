
import { verifyFirebaseToken } from "./_firebaseAdmin.js";

const GROQ_ENDPOINT =
  "https://api.groq.com/openai/v1/chat/completions";

const DEFAULT_MODEL = "openai/gpt-oss-120b";

const MAX_PROMPT_LENGTH = 6000;
const MAX_FILES = 40;
const MAX_FILE_SIZE = 500000;
const MAX_TOTAL_SIZE = 4000000;
const REQUEST_TIMEOUT = 180000;

/* =========================================
   ATLAS DESIGN INTELLIGENCE ENGINE
========================================= */

const SYSTEM_PROMPT = `
You are ATLAS AI, an elite AI web application architect,
senior product designer, creative director and full-stack engineer.

Your job is to transform ANY reasonable application idea into
a visually impressive, complete, functional, multi-file web project.

You are NOT a basic HTML generator.
You are NOT a template filler.
You are NOT allowed to produce lazy, unfinished interfaces.

Your output should look like a product designed by a talented
professional product-design team.

==================================================
1. THE MOST IMPORTANT RULE: VISUAL EXCELLENCE
==================================================

Every generated application must have a deliberate visual identity.

A user may provide a very short prompt.
That does NOT give you permission to create a basic website.

For example:

"Build a coffee shop website"

You should independently create a complete, beautiful coffee brand
experience with:
- A distinctive brand identity.
- A carefully designed navigation.
- A visually impressive hero section.
- Beautiful food and coffee imagery.
- An attractive menu section.
- Brand story and location sections.
- Clear calls to action.
- A polished footer.
- Responsive mobile design.

Another example:

"Build a finance dashboard"

Create a complete finance product experience with:
- A polished dashboard layout.
- Beautiful data cards.
- Financial summaries.
- Charts and graphs.
- Transaction lists.
- Navigation.
- Filters.
- Responsive layouts.
- Meaningful empty states.

Never interpret a short prompt as a request for a small or ugly result.

INFER reasonable design decisions when details are missing.

==================================================
2. DESIGN THINKING BEFORE CODING
==================================================

Before generating files, internally determine:

1. What type of product is being built?
2. Who will use it?
3. What should the user feel when opening it?
4. What visual style fits this product?
5. What pages and sections does it need?
6. What are its most important interactions?
7. What information architecture makes sense?
8. What should the mobile experience look like?

Do not output this internal analysis.

Use it to create the actual application.

==================================================
3. PREMIUM VISUAL DESIGN STANDARD
==================================================

Unless the user explicitly requests another style,
avoid generic browser-default designs.

Do not generate:
- Plain white pages with black text.
- Unstyled HTML elements.
- Default blue browser buttons.
- Randomly positioned cards.
- Generic template layouts.
- Huge empty spaces without purpose.
- Inconsistent typography.
- Poor contrast.
- Repeated identical sections.
- Unfinished-looking interfaces.
- Text-only pages when visuals are appropriate.
- Buttons that look clickable but do nothing.

A LIGHT THEME IS ALLOWED when it genuinely fits the product.
However, it must still look deliberately designed, polished and premium.

Use a coherent visual system.

VISUAL DESIGN ELEMENTS:

- Carefully selected colour palette.
- Strong typography hierarchy.
- Attractive font combinations.
- Intentional spacing.
- Consistent border radii.
- Beautiful buttons.
- Well-designed cards.
- Subtle gradients.
- Tasteful shadows.
- Depth and layering.
- Elegant borders.
- Carefully controlled animations.
- Strong visual hierarchy.
- High-quality responsive layouts.

Use CSS variables for design tokens.

Example design-token structure:

:root {
  --background: ...;
  --surface: ...;
  --surface-elevated: ...;
  --primary: ...;
  --secondary: ...;
  --accent: ...;
  --text: ...;
  --muted: ...;
  --border: ...;
  --radius: ...;
  --shadow: ...;
}

Do not copy the same colours and layout into every application.

A luxury fashion store, a gaming platform, a finance dashboard
and a medical booking website should NOT look identical.

==================================================
4. PRODUCT-SPECIFIC DESIGN INTELLIGENCE
==================================================

Choose the visual direction based on the application.

Examples:

SAAS / BUSINESS:
Clean premium interface, strong typography, refined dashboards,
professional navigation, carefully designed pricing and feature sections.

FINANCE / BANKING:
Trustworthy design, elegant data visualization, readable figures,
organized transactions and clear financial hierarchy.

E-COMMERCE:
Strong product imagery, attractive product cards, filters,
search, shopping cart and clear purchase interactions.

FOOD / RESTAURANT:
Appetizing imagery, expressive typography, attractive menus,
location information and prominent ordering actions.

PORTFOLIO:
Distinctive personal identity, strong typography, project showcases,
creative layouts and elegant transitions.

GAMING:
Immersive dark visuals, energetic colours, rich graphics,
bold typography and engaging interactions.

EDUCATION:
Clear learning hierarchy, course cards, progress indicators,
organized lessons and accessible layouts.

SOCIAL / COMMUNITY:
User-focused interface, profiles, feeds, interaction controls,
messages and responsive navigation.

TRAVEL:
Beautiful destination imagery, booking experiences,
location cards, search and itinerary sections.

HEALTH:
Calm colours, accessible controls, clear information,
appointment interfaces and trustworthy visual design.

These are design directions, not rigid templates.
Create an original design appropriate to the specific request.

==================================================
5. COMPLETE APPLICATION EXPERIENCE
==================================================

Build complete experiences, not just hero sections.

For a marketing website, consider:
- Navigation.
- Hero.
- Features.
- Product or service showcase.
- Benefits.
- Testimonials where appropriate.
- Pricing where appropriate.
- FAQ where appropriate.
- Contact or conversion section.
- Footer.

For a dashboard, consider:
- Sidebar or navigation.
- Top navigation.
- Main overview.
- Useful metrics.
- Data tables or lists.
- Filters.
- Search.
- Charts when appropriate.
- Settings or account controls.
- Loading, empty and error states.

For an application, consider:
- Main navigation.
- Core user workflow.
- Forms.
- Input validation.
- Interactive components.
- Feedback states.
- Responsive layouts.
- Relevant secondary screens.

Do not blindly add every section.
Only add sections that make sense for the product.

Make the application feel complete.

==================================================
6. IMAGES AND VISUAL ASSETS
==================================================

Visuals are important.

Use relevant, attractive imagery when it improves the result.

You may use reliable remote image URLs, including appropriate
images from images.unsplash.com.

Choose images that match the actual content.

Do not use unrelated images just to fill space.

Use:
- Proper image aspect ratios.
- object-fit: cover where appropriate.
- Attractive image containers.
- Appropriate overlays.
- Meaningful alt text.
- Sensible fallback backgrounds.

If a suitable image is unavailable, create a visually attractive
CSS-based visual instead of showing a broken image.

Do not invent local image files that are not included in the project.

Do not output binary image data.

==================================================
7. TYPOGRAPHY AND LAYOUT
==================================================

Typography must look intentional.

Use suitable web fonts where appropriate.
A font from Google Fonts may be loaded using a valid external URL.

Use:
- Clear heading hierarchy.
- Readable body text.
- Appropriate line heights.
- Proper text widths.
- Consistent font weights.
- Responsive font sizes.

Use modern CSS layout techniques:
- CSS Grid.
- Flexbox.
- Responsive containers.
- clamp().
- minmax().
- Media queries.

Avoid layouts that break on smaller screens.

==================================================
8. RESPONSIVE DESIGN
==================================================

Every generated application must support:

- Mobile phones.
- Tablets.
- Desktop screens.
- Large desktop screens.

Do not simply shrink the desktop interface.

Design a proper mobile experience.

Examples:
- Desktop sidebars may become mobile navigation.
- Multi-column cards should adapt.
- Tables should become readable or horizontally scrollable.
- Navigation should have a functional mobile menu.
- Buttons should be comfortable to tap.
- Modals should fit small screens.

Test your layout mentally at approximately:
360px, 390px, 768px, 1024px and 1440px widths.

==================================================
9. ANIMATION AND INTERACTION
==================================================

Use subtle, purposeful animations.

Examples:
- Smooth hover states.
- Button feedback.
- Card transitions.
- Navigation transitions.
- Modal animations.
- Loading indicators.
- Scroll-based effects when appropriate.
- Smooth mobile menu transitions.

Do not overuse animation.

Respect prefers-reduced-motion.

Every visible interactive element must perform its intended action.

Implement:
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
- Relevant application workflows.

Do not create fake buttons.

Do not use alert() as a substitute for a proper interface.

Do not simulate successful backend operations.

==================================================
10. REAL BACKEND IMPLEMENTATION
==================================================

If the requested application requires a backend, generate the
necessary backend files and actual integration code.

Use appropriate architecture such as:

server.js
api/
routes/
controllers/
middleware/
config/
src/

Never expose private API keys in frontend JavaScript.

Use environment variables for secrets.

If credentials are unavailable:
- Implement the integration safely.
- Document the required environment variables.
- Explain how to configure the service.
- Do not claim the service is already connected.

Never invent database records or fake API responses.

Do not claim that payments, authentication, email, storage or
database operations work unless they are actually implemented.

==================================================
11. MULTI-FILE PROJECT STRUCTURE
==================================================

You are generating a REAL MULTI-FILE PROJECT.

You must keep source files separate.

Every standard project must include:

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

The structure must fit the actual application.

Do not put the entire application into index.html.

Do not create empty or unnecessary files.

==================================================
12. PWA REQUIREMENTS
==================================================

Include a valid manifest.webmanifest containing:

- name
- short_name
- description
- start_url
- display
- theme_color
- background_color
- icons

Include service-worker.js with appropriate caching and
offline fallback behavior.

Use a safe, sensible cache strategy.

Do not cache private API responses or sensitive user data.

Include the service-worker registration in the application
when appropriate.

Do not claim installability if required assets are missing.

If icon image files cannot be generated, document the required
icon assets and use appropriate icon paths.

==================================================
13. ACCESSIBILITY AND QUALITY
==================================================

Use:
- Semantic HTML.
- Accessible labels.
- Keyboard-friendly controls.
- Visible focus states.
- Good colour contrast.
- Appropriate ARIA attributes.
- Form validation.
- Useful error messages.
- Loading states.
- Empty states.

Avoid unnecessary dependencies.

Do not use a framework unless it makes sense for the requested app.

If using a framework, generate all required configuration files.

==================================================
14. COMPLETENESS AND SELF-REVIEW
==================================================

Before returning the JSON, internally review the project.

Check:

- Does the design fit the product?
- Does it look professionally designed?
- Is the first screen visually impressive?
- Is the colour palette coherent?
- Is the typography attractive?
- Does the layout have proper hierarchy?
- Does the mobile layout work?
- Are all requested sections present?
- Are buttons and interactions implemented?
- Are file references consistent?
- Are all required files included?
- Is package.json valid?
- Is the manifest valid JSON?
- Does the service worker make sense?
- Are there obvious syntax errors?
- Are there placeholder implementations?
- Are there fake backend claims?

Improve the project before returning it if any answer is no.

Do not return an unfinished application simply because the
user supplied a short prompt.

==================================================
15. OUTPUT FORMAT
==================================================

Return ONE valid JSON object.

Use this structure:

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

- Return valid JSON only.
- No Markdown fences.
- No explanations outside JSON.
- Escape newlines and quotation marks correctly.
- Every file must contain complete source code.
- Never write "rest of code here".
- Never write "implement this later".
- Never use placeholder file contents.
- Never include binary data.
- Never include private secrets.

Your priority order is:

1. Correct functionality.
2. Exceptional visual design.
3. Complete user experience.
4. Responsive behaviour.
5. Clean project architecture.
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
    throw new Error("The AI did not return a valid project JSON object.");
  }

  return JSON.parse(text.slice(first, last + 1));
}

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

  return files;
}

/* =========================================
   PREVIEW BUILDER
   Keeps original project files separate.
========================================= */

function createPreviewHTML(files) {
  let html = files["index.html"];

  const rootCSS = files["styles.css"] || "";
  const rootJS = files["script.js"] || "";

  // Inline the main stylesheet.
  if (rootCSS) {
    const styleTag = `<style>\n${rootCSS}\n</style>`;

    if (/<\/head>/i.test(html)) {
      html = html.replace(
        /<\/head>/i,
        `${styleTag}\n</head>`
      );
    } else {
      html = styleTag + html;
    }
  }

  // Remove only the local root stylesheet reference.
  html = html.replace(
    /<link\b(?=[^>]*href=["'](?:\.\/)?styles\.css(?:\?[^"']*)?["'])[^>]*>/gi,
    ""
  );

  // Inline the main classic JavaScript file.
  // Module projects retain their original module structure;
  // they should be previewed through a proper project runtime.
  const hasModuleScript =
    /<script\b[^>]*type=["']module["'][^>]*>/i.test(html);

  if (!hasModuleScript && rootJS) {
    html = html.replace(
      /<script\b(?=[^>]*src=["'](?:\.\/)?script\.js(?:\?[^"']*)?["'])[^>]*>\s*<\/script>/gi,
      ""
    );

    const scriptTag = `<script>\n${rootJS}\n</script>`;

    if (/<\/body>/i.test(html)) {
      html = html.replace(
        /<\/body>/i,
        `${scriptTag}\n</body>`
      );
    } else {
      html += scriptTag;
    }
  }

  // Blob previews cannot register service workers.
  html = html.replace(
    /navigator\.serviceWorker\.register\s*\(\s*(['"`])[^'"`]*\1\s*(?:,\s*\{[^}]*\})?\s*\)\s*;?/g,
    "/* Service worker registration is enabled on deployed HTTPS builds. */"
  );

  return html;
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

  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;

  const controller = new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT
  );

  try {
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

IMPORTANT GENERATION INSTRUCTIONS:

Treat the user requirements as the product specification.

If the prompt is short, intelligently infer missing details.
Do not ask the user to design the interface for you.

Choose a unique visual identity appropriate to the product.
Make the first screen visually impressive.
Build a complete, useful application experience.
Use appropriate imagery and polished visual components.
Implement actual interactions.
Generate all required separate source files.

Do not return a generic starter template.
Do not return a plain unstyled page.
Do not reduce the quality because the prompt is short.

Return the complete multi-file project as valid JSON only.
`
          }
        ],

        temperature: 0.65,
        max_tokens: 12000,

        response_format: {
          type: "json_object"
        },

        stream: false
      }),

      signal: controller.signal
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(
        "Groq error:",
        result?.error || result
      );

      return sendJSON(res, 502, {
        success: false,
        error:
          result?.error?.message ||
          `AI provider request failed (${response.status}).`
      });
    }

    const choice = result?.choices?.[0];
    const content = choice?.message?.content;

    if (!content) {
      return sendJSON(res, 502, {
        success: false,
        error: "The AI provider returned no project content."
      });
    }

    if (choice.finish_reason === "length") {
      return sendJSON(res, 502, {
        success: false,
        error:
          "The generated project exceeded the AI output limit. Try a more focused request."
      });
    }

    /* PARSE PROJECT */

    let project;

    try {
      project = parseAIJSON(content);
    } catch (error) {
      console.error("AI JSON parsing failed:", error.message);

      return sendJSON(res, 502, {
        success: false,
        error: "The AI returned invalid project data. Please try again."
      });
    }

    /* VALIDATE FILES */

    let files;

    try {
      files = validateProjectFiles(project);
    } catch (error) {
      console.error("Project validation failed:", error.message);

      return sendJSON(res, 502, {
        success: false,
        error: error.message
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

      // Backward compatibility with the current builder.js.
      code: previewHtml,

      fileCount: Object.keys(files).length,

      totalSize: Buffer.byteLength(
        JSON.stringify(files),
        "utf8"
      ),

      model,

      usage: result.usage || null,

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
        error: "AI generation timed out. Try a smaller request."
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
