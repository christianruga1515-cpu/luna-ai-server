import express from 'express';
import Groq from 'groq-sdk';
import nodemailer from 'nodemailer';
import 'dotenv/config';

const app = express();
app.use(express.json());
app.use(express.static('.'));

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
    }
});

const utentiRegistrati = {}; 
const otps = {};

app.post('/api/auth/request-otp', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email e Password richieste" });
    
    if (utentiRegistrati[email]) {
        if (utentiRegistrati[email] !== password) {
            return res.status(401).json({ error: "Password errata!" });
        }
    } else {
        utentiRegistrati[email] = password;
    }
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otps[email] = otp;

    console.log('🌙 [LUNA AI] Spedizione e-mail protetta in corso...');

    const mailOptions = {
        from: `"Luna AI Security" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: 'Il tuo codice segreto OTP di Luna AI 🌙',
        text: 'Il tuo codice di verifica OTP per accedere a Luna AI e: ' + otp
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Impossibile inviare la mail di sicurezza." });
    }
});

app.post('/api/auth/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    if (otps[email] && otps[email] === otp) {
        delete otps[email];
        return res.json({ success: true, token: "luna_" + Math.random().toString(36).substring(2) });
    }
    res.status(401).json({ error: "Codice OTP errato." });
});

app.post('/api/chat', async (req, res) => {
    const { prompt } = req.body;
    try {
        if (prompt.toLowerCase().startsWith('/immagina')) {
            const descrizioneImg = encodeURIComponent(prompt.replace('/immagina', '').trim());
            const urlImmagine = 'https://pollinations.ai' + descrizioneImg + '?width=1024&height=1024&seed=' + Math.floor(Math.random() * 1000);
            return res.json({ type: 'image', content: urlImmagine });
        }
        
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "Tu sei Luna AI, parlo in italiano." },
                { role: "user", content: prompt }
            ],
            model: "llama-3.1-8b-instant",
        });

        return res.json({ type: 'text', content: chatCompletion.choices?.message?.content || "Nessuna risposta." });
    } catch (error) {
        res.status(500).json({ error: "Errore." });
    }
});

app.listen(3000, () => console.log('🚀 Server Luna AI Pronto!'));
