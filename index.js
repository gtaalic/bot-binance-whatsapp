const express = require("express");
const axios = require("axios");
const Binance = require("binance-api-node").default;

const client = Binance({
  apiKey: process.env.API_KEY,
  apiSecret: process.env.API_SECRET,
});

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.PHONE_ID;
const NUMERO = process.env.NUMERO;

const app = express();
app.use(express.json());

async function enviarWhatsApp(texto) {
  try {
    await axios.post(
      `https://graph.facebook.com/v17.0/${PHONE_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: NUMERO,
        type: "text",
        text: { body: texto },
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (e) {
    console.log("Error enviando WhatsApp:", e.response?.data || e);
  }
}

async function detectarComprasMasivas() {
  console.log("Bot iniciado. Monitoreando compras masivas...");

  try {
    const info = await client.exchangeInfo();
    const symbols = info.symbols
      .filter((s) => s.quoteAsset === "USDT")
      .map((s) => s.symbol);

    setInterval(async () => {
      for (const symbol of symbols) {
        try {
          const trades = await client.trades({ symbol });
          const ultimos = trades.slice(-20);

          const volumen = ultimos.reduce(
            (acc, t) => acc + parseFloat(t.qty) * parseFloat(t.price),
            0
          );

          if (volumen > 500000) {
            enviarWhatsApp(
              `🚨 *COMPRA MASIVA DETECTADA*\n\n` +
                `Moneda: *${symbol}*\n` +
                `Volumen: *$${volumen.toFixed(0)}*\n\n` +
                `Opciones de compra:\n` +
                `👉 comprar 100 ${symbol}\n` +
                `👉 comprar 200 ${symbol}`
            );
          }
        } catch (e) {
          console.log("Error en", symbol);
        }
      }
    }, 5000);
  } catch (e) {
    console.log("Binance bloquea esta región. En Render funcionará.");
  }
}

app.post("/webhook", async (req, res) => {
  try {
    const
