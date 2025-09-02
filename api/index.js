const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");

const app = express();

// Route root "/"
app.get("/", (req, res) => {
    res.send("✅ API Backend is running. Cek /api atau /api-docs");
});

// Route sample "/api"
app.get("/api", (req, res) => {
    res.json({ message: "API is working on Vercel!" });
});

// Swagger docs "/api-docs"
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Export (bukan listen)
module.exports = app;
