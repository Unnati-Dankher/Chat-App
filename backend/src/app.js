import { webcrypto } from "node:crypto";

if (!globalThis.crypto) {
  globalThis.crypto = webcrypto;
}

import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDB } from './config/db.js';
import { app, server } from './socket/socket.js';

import indexRouter from './routes/index.js';

// Resolve static path in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect Database
connectDB();

// CORS setup (note: Socket.IO cors is configured independently inside socket.js)
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);

// Parsers
app.use(express.json({ limit: '10mb' })); // Support larger payloads for profile images
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Serve local media uploads statically (Part 6 fallback)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api', indexRouter);

// Simple Healthcheck Route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

// Listening
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
