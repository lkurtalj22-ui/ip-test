const express = require("express");
const fs = require("fs");
const app = express();
app.use(express.urlencoded({ extended: false }));

function getIp(req) {
  return (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "")
    .split(",")[0]
    .trim();
}

function anonymize(ip) {
  if (!ip) return ip;
  if (ip.includes(".")) {
    const p = ip.split(".");
    if (p.length === 4) {
      p[3] = "0"; // anonimiziraj zadnji oktet
      return p.join(".");
    }
  }
  return ip; // IPv6 ostavi kako jest ili dodatno anonimiziraj po potrebi
}

app.get("/", (req, res) => {
  res.send(`
    <h2>Privola za testiranje</h2>
    <p>Radi testa, zabilježit ćemo IP i user-agent uz tvoju privolu.</p>
    <form method="POST" action="/consent">
      <label><input type="checkbox" name="consent" required> Slažem se</label><br><br>
      <button type="submit">Pošalji</button>
    </form>
  `);
});

app.post("/consent", (req, res) => {
  const rawIp = getIp(req);
  const anonIp = anonymize(rawIp);
  const rec = {
    time: new Date().toISOString(),
    ip_anon: anonIp,
    ip_full: rawIp,
    ua: req.headers["user-agent"] || ""
  };
  fs.appendFileSync("access.log", JSON.stringify(rec) + "\n");
  res.send("<p>Hvala — podaci su zabilježeni.</p>");
});

// (Opcionalno za test) pregled logova — ukloni nakon testiranja!
app.get("/logs", (req, res) => {
  if (!fs.existsSync("access.log")) return res.send("Nema zapisa još.");
  const txt = fs.readFileSync("access.log", "utf8");
  res.type("text/plain").send(txt);
});

app.listen(process.env.PORT || 3000, () => console.log("Server pokrenut"));
