require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const frontendDistPath = path.join(__dirname, "frontend", "dist");
const BACKEND_VERSION = "2026-06-23-expired-agenda-v8";

app.disable("etag");
app.use(cors());
app.use(express.json());
app.use((_, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
});
app.use("/midia", express.static(path.join(__dirname, "public")));

app.get("/health", (_, res) => {
  res.json({ ok: true, version: BACKEND_VERSION });
});

app.use("/agenda", require("./routes/agenda"));
app.use("/auth", require("./routes/auth"));
app.use("/users", require("./routes/users"));
app.use("/autoridades", require("./routes/autoridades"));
app.use("/aniversariantes", require("./routes/aniversariantes"));
app.use("/painel-config", require("./routes/painel-config"));
app.use("/public", require("./routes/public"));

app.use(
  express.static(frontendDistPath, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".html") || filePath.endsWith(".js") || filePath.endsWith(".css")) {
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
      }
    }
  })
);

app.get("*", (_req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.sendFile(path.join(frontendDistPath, "index.html"));
});

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
