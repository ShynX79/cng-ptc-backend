const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json"); // file swagger docs kamu

const app = express();

// Route sample
app.get("/api", (req, res) => {
    res.json({ message: "API is working on Vercel!" });
});

// Swagger docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ❌ jangan pakai app.listen()
// ✅ harus export app
module.exports = app;
