const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const fs = require('fs');

const execPromise = util.promisify(exec);
const app = express();
const PORT = process.env.PORT || 3333;

// Data manager
const DataManager = require('./lib/data-manager');
const dataManager = new DataManager(path.join(__dirname, '..', 'apps', 'mobile', 'data'));

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ===== CARDS API =====

// Get all cards
app.get('/api/cards', (req, res) => {
  try {
    const cards = dataManager.getAllCards();
    res.json({ success: true, count: cards.length, data: cards });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get card by ID
app.get('/api/cards/:id', (req, res) => {
  try {
    const card = dataManager.getCardById(req.params.id);
    if (!card) return res.status(404).json({ success: false, error: 'Card not found' });
    res.json({ success: true, data: card });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new card
app.post('/api/cards', async (req, res) => {
  try {
    const card = dataManager.createCard(req.body);
    await dataManager.saveCards();
    res.json({ success: true, data: card });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update card
app.put('/api/cards/:id', async (req, res) => {
  try {
    const card = dataManager.updateCard(req.params.id, req.body);
    if (!card) return res.status(404).json({ success: false, error: 'Card not found' });
    await dataManager.saveCards();
    res.json({ success: true, data: card });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete card
app.delete('/api/cards/:id', async (req, res) => {
  try {
    const deleted = dataManager.deleteCard(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, error: 'Card not found' });
    await dataManager.saveCards();
    res.json({ success: true, message: 'Card deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===== KINKS API =====

// Get all kinks
app.get('/api/kinks', (req, res) => {
  try {
    const lang = req.query.lang || 'en';
    const kinks = dataManager.getAllKinks(lang);
    res.json({ success: true, count: kinks.length, data: kinks });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get kink by ID
app.get('/api/kinks/:id', (req, res) => {
  try {
    const lang = req.query.lang || 'en';
    const kink = dataManager.getKinkById(req.params.id, lang);
    if (!kink) return res.status(404).json({ success: false, error: 'Kink not found' });
    res.json({ success: true, data: kink });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new kink
app.post('/api/kinks', async (req, res) => {
  try {
    const lang = req.query.lang || 'en';
    const kink = dataManager.createKink(req.body, lang);
    await dataManager.saveKinks(lang);
    res.json({ success: true, data: kink });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update kink
app.put('/api/kinks/:id', async (req, res) => {
  try {
    const lang = req.query.lang || 'en';
    const kink = dataManager.updateKink(req.params.id, req.body, lang);
    if (!kink) return res.status(404).json({ success: false, error: 'Kink not found' });
    await dataManager.saveKinks(lang);
    res.json({ success: true, data: kink });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete kink
app.delete('/api/kinks/:id', async (req, res) => {
  try {
    const lang = req.query.lang || 'en';
    const deleted = dataManager.deleteKink(req.params.id, lang);
    if (!deleted) return res.status(404).json({ success: false, error: 'Kink not found' });
    await dataManager.saveKinks(lang);
    res.json({ success: true, message: 'Kink deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===== CONVERSATION STARTERS API =====

// Get all conversation starters
app.get('/api/conversations', (req, res) => {
  try {
    const lang = req.query.lang || 'en';
    const starters = dataManager.getAllConversationStarters(lang);
    res.json({ success: true, count: starters.length, data: starters });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get conversation starter by ID
app.get('/api/conversations/:id', (req, res) => {
  try {
    const lang = req.query.lang || 'en';
    const starter = dataManager.getConversationStarterById(req.params.id, lang);
    if (!starter) return res.status(404).json({ success: false, error: 'Conversation starter not found' });
    res.json({ success: true, data: starter });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new conversation starter
app.post('/api/conversations', async (req, res) => {
  try {
    const lang = req.query.lang || 'en';
    const starter = dataManager.createConversationStarter(req.body, lang);
    await dataManager.saveConversationStarters(lang);
    res.json({ success: true, data: starter });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update conversation starter
app.put('/api/conversations/:id', async (req, res) => {
  try {
    const lang = req.query.lang || 'en';
    const starter = dataManager.updateConversationStarter(req.params.id, req.body, lang);
    if (!starter) return res.status(404).json({ success: false, error: 'Conversation starter not found' });
    await dataManager.saveConversationStarters(lang);
    res.json({ success: true, data: starter });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete conversation starter
app.delete('/api/conversations/:id', async (req, res) => {
  try {
    const lang = req.query.lang || 'en';
    const deleted = dataManager.deleteConversationStarter(req.params.id, lang);
    if (!deleted) return res.status(404).json({ success: false, error: 'Conversation starter not found' });
    await dataManager.saveConversationStarters(lang);
    res.json({ success: true, message: 'Conversation starter deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===== GIT API =====

// Get git status
app.get('/api/git/status', async (req, res) => {
  try {
    const { stdout } = await execPromise('git status --short', { cwd: path.join(__dirname, '..') });
    res.json({ success: true, status: stdout || 'No changes' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Commit and push changes
app.post('/api/git/commit', async (req, res) => {
  try {
    const { message } = req.body;
    const cwd = path.join(__dirname, '..');
    
    await execPromise('git add -A', { cwd });
    await execPromise(`git commit -m "${message || 'Update content via admin tool'}"`, { cwd });
    await execPromise('git push origin main', { cwd });
    
    res.json({ success: true, message: 'Changes committed and pushed' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===== STATS API =====

// Get stats
app.get('/api/stats', (req, res) => {
  try {
    const stats = dataManager.getStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║         SpiceSync Admin Tool                           ║
║                                                        ║
║  Server running on http://0.0.0.0:${PORT}              ║
║                                                        ║
║  For SSH tunnel from your machine:                     ║
║  ssh -L 3333:localhost:3333 root@<server-ip>           ║
║                                                        ║
║  Then open http://localhost:3333 on your machine       ║
╚════════════════════════════════════════════════════════╝
  `);
});