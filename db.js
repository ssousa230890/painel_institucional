const mysql = require("mysql2");

const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "painel_cmp",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

db.getConnection((err, connection) => {
  if (err) {
    const details = err.message || err.code || "erro desconhecido";
    console.error("Nao foi possivel conectar no MySQL:", details);
    return;
  }

  console.log("MySQL conectado com sucesso.");
  connection.release();
});

module.exports = db;
