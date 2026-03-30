const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs');

const {
  loadGameCards,
  loadKinks,
  loadConversationStarters,
  saveGameCards,
  saveKinks,
  saveConversationStarters
} = require('./lib/data-manager');

const app = express();
const PORT = process.env.PORT || 3456;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Git setup
const git = simpleGit(path.join(__dirname, '..'));

// Helper to commit changes
async function commitChanges(message) {
  try {
    const status = await git.status();
    if (status.files.length === 0) {
      return { success: true, message: 'No changes to commit' };
    }
    
    await git.add('.');
    await git.commit(message);
    
    // Try to push if remote exists
    try {
      await git.push('origin', 'main');
      return { success: true, message: 'Changes committed and pushed to GitHub' };
    } catch (pushErr) {
      return { success: true, message: 'Changes committed locally (push to GitHub failed)' };
    }
  } catch (err) {
    console.error('Git error:', err);
    return { success: false, message: err.message };
  }
}

// ===== GAME CARDS API =====

// Get all game cards
app.get('/api/gamecards', (req, res) => {
  try {
    const cards = loadGameCards();
    res.json({ success: true, data: cards });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new game card
app.post('/api/gamecards', async (req, res) => {
  try {
    const cards = loadGameCards();
    const newCard = req.body;
    
    // Generate ID if not provided
    if (!newCard.id) {
      const prefix = newCard.isPremium ? 'p' : 'f';
      const typeChar = newCard.type ? newCard.type[0] : 't';
      const existingIds = cards.filter(c => c.id && c.id.startsWith(`${prefix}-${typeChar}`)).map(c => parseInt(c.id.split('-')[2]) || 0);
      const maxId = Math.max(0, ...existingIds);
      newCard.id = `${prefix}-${typeChar}${maxId + 1}`;
    }
    
    // Check for duplicate ID
    if (cards.some(c => c.id === newCard.id)) {
      return res.status(400).json({ success: false, error: 'Card with this ID already exists' });
    }
    
    cards.push(newCard);
    saveGameCards(cards);
    
    const gitResult = await commitChanges(`Add game card: ${newCard.id}`);
    
    res.json({ success: true, data: newCard, git: gitResult });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update game card
app.put('/api/gamecards/:id', async (req, res) => {
  try {
    const cards = loadGameCards();
    const id = req.params.id;
    const updates = req.body;
    
    const index = cards.findIndex(c => c.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Card not found' });
    }
    
    // Preserve internal fields
    updates._source = cards[index]._source;
    updates._arrayName = cards[index]._arrayName;
    
    cards[index] = { ...cards[index], ...updates };
    saveGameCards(cards);
    
    const gitResult = await commitChanges(`Update game card: ${id}`);
    
    res.json({ success: true, data: cards[index], git: gitResult });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete game card
app.delete('/api/gamecards/:id', async (req, res) => {
  try {
    const cards = loadGameCards();
    const id = req.params.id;
    
    const index = cards.findIndex(c => c.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Card not found' });
    }
    
    cards.splice(index, 1);
    saveGameCards(cards);
    
    const gitResult = await commitChanges(`Delete game card: ${id}`);
    
    res.json({ success: true, git: gitResult });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===== KINKS API =====

// Get all kinks
app.get('/api/kinks', (req, res) => {
  try {
    const kinks = loadKinks();
    res.json({ success: true, data: kinks });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new kink
app.post('/api/kinks', async (req, res) => {
  try {
    const kinks = loadKinks();
    const newKink = req.body;
    
    // Generate ID if not provided
    if (!newKink.id) {
      const existingIds = kinks.map(k => parseInt(k.id) || 0);
      const maxId = Math.max(0, ...existingIds);
      newKink.id = String(maxId + 1).padStart(4, '0');
    }
    
    // Check for duplicate ID
    if (kinks.some(k => k.id === newKink.id)) {
      return res.status(400).json({ success: false, error: 'Kink with this ID already exists' });
    }
    
    kinks.push(newKink);
    saveKinks(kinks);
    
    const gitResult = await commitChanges(`Add kink: ${newKink.id}`);
    
    res.json({ success: true, data: newKink, git: gitResult });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update kink
app.put('/api/kinks/:id', async (req, res) => {
  try {
    const kinks = loadKinks();
    const id = req.params.id;
    const updates = req.body;
    
    const index = kinks.findIndex(k => k.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Kink not found' });
    }
    
    // Preserve internal fields
    updates._source = kinks[index]._source;
    
    kinks[index] = { ...kinks[index], ...updates };
    saveKinks(kinks);
    
    const gitResult = await commitChanges(`Update kink: ${id}`);
    
    res.json({ success: true, data: kinks[index], git: gitResult });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete kink
app.delete('/api/kinks/:id', async (req, res) => {
  try {
    const kinks = loadKinks();
    const id = req.params.id;
    
    const index = kinks.findIndex(k => k.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Kink not found' });
    }
    
    kinks.splice(index, 1);
    saveKinks(kinks);
    
    const gitResult = await commitChanges(`Delete kink: ${id}`);
    
    res.json({ success: true, git: gitResult });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===== CONVERSATION STARTERS API =====

// Get all conversation starters
app.get('/api/conversation-starters', (req, res) => {
  try {
    const starters = loadConversationStarters();
    res.json({ success: true, data: starters });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new conversation starter
app.post('/api/conversation-starters', async (req, res) => {
  try {
    const starters = loadConversationStarters();
    const newStarter = req.body;
    
    // Generate ID if not provided
    if (!newStarter.id) {
      const category = newStarter.category || 'date_night';
      const prefix = `conv-${category.split('_')[0]}-`;
      const existingIds = starters
        .filter(s => s.id && s.id.startsWith(prefix))
        .map(s => parseInt(s.id.split('-').pop()) || 0);
      const maxId = Math.max(0, ...existingIds);
      newStarter.id = `${prefix}${String(maxId + 1).padStart(3, '0')}`;
    }
    
    // Check for duplicate ID
    if (starters.some(s => s.id === newStarter.id)) {
      return res.status(400).json({ success: false, error: 'Conversation starter with this ID already exists' });
    }
    
    starters.push(newStarter);
    saveConversationStarters(starters);
    
    const gitResult = await commitChanges(`Add conversation starter: ${newStarter.id}`);
    
    res.json({ success: true, data: newStarter, git: gitResult });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update conversation starter
app.put('/api/conversation-starters/:id', async (req, res) => {
  try {
    const starters = loadConversationStarters();
    const id = req.params.id;
    const updates = req.body;
    
    const index = starters.findIndex(s => s.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Conversation starter not found' });
    }
    
    // Preserve internal fields
    updates._source = starters[index]._source;
    updates._arrayName = starters[index]._arrayName;
    
    starters[index] = { ...starters[index], ...updates };
    saveConversationStarters(starters);
    
    const gitResult = await commitChanges(`Update conversation starter: ${id}`);
    
    res.json({ success: true, data: starters[index], git: gitResult });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete conversation starter
app.delete('/api/conversation-starters/:id', async (req, res) => {
  try {
    const starters = loadConversationStarters();
    const id = req.params.id;
    
    const index = starters.findIndex(s => s.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Conversation starter not found' });
    }
    
    starters.splice(index, 1);
    saveConversationStarters(starters);
    
    const gitResult = await commitChanges(`Delete conversation starter: ${id}`);
    
    res.json({ success: true, git: gitResult });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Git status endpoint
app.get('/api/git/status', async (req, res) => {
  try {
    const status = await git.status();
    res.json({ success: true, data: status });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🎴 SpiceSync Admin Server running on http://localhost:${PORT}`);
  console.log(`📁 Data directory: ${path.join(__dirname, '../apps/mobile/data')}`);
});

module.exports = app;