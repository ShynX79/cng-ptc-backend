// FILE: api/index.js
const express = require("express");
const app = express();

app.get("/", (req, res) => {
    res.json({ message: "Backend API is running 🎉" });
});

app.get("/hello", (req, res) => {
    res.json({ message: "Hello from API!" });
});

module.exports = app;
