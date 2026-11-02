
export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed."
    });
  }

  const groqConfigured = Boolean(process.env.GROQ_API_KEY);
  const firebaseConfigured = Boolean(process.env.FIREBASE_SERVICE_ACCOUNT);

  const services = {
    server: "online",
    groq: groqConfigured ? "configured" : "missing_configuration",
    firebase: firebaseConfigured ? "configured" : "missing_configuration"
  };

  const ready = groqConfigured && firebaseConfigured;

  return res.status(ready ? 200 : 503).json({
    success: true,
    app: "ATLAS AI BUILDER",
    tagline: "Build anything. Create everything.",
    status: ready ? "ready" : "configuration_required",
    timestamp: new Date().toISOString(),
    services
  });
}
