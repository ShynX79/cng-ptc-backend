import express from "express";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

const app = express();

const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "CNG-PTC API",
            version: "1.0.0",
            description: "Dokumentasi API Swagger",
        },
    },
    apis: ["./src/**/*.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.get("/swagger.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/api", (req, res) => {
    res.json({ message: "API is running ✅" });
});

// Vercel butuh handler export
export default app;
