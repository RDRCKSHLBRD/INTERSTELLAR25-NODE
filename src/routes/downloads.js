import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

// Directory fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Placeholder for individual album download pages
// These will serve your existing /dl files



export default router;