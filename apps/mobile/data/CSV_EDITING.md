# SpiceSync Cards - CSV Editing

## Quick Workflow

### 1. Export to CSV (do this first)
```bash
cd scripts
node csv-converter.js export
```

This creates `game_cards.csv` in the data folder.

### 2. Edit in Spreadsheet
Open `game_cards.csv` in:
- **Excel** — Double-click the file
- **Google Sheets** — File → Import → Upload
- **Numbers** — File → Open
- **Any text editor** — VS Code, Sublime, etc.

### 3. Edit Cards

| Column | Description | Example |
|--------|-------------|---------|
| `id` | Unique ID (don't change existing) | `lvl3-d-042` |
| `type` | truth, dare, challenge, fantasy, roleplay | `dare` |
| `content` | The card text | `Kiss me...` |
| `intensity` | 1-5 (1=mild, 5=extreme) | `3` |
| `category` | communication, physical, emotional, playful, intimate | `intimate` |
| `isPremium` | true or false | `true` |
| `estimatedTime` | How long it takes | `5 min` |
| `requires` | Items needed (semicolon separated) | `ice;blindfold` |
| `safetyNotes` | Warnings for intense cards | `⚠️ Start light...` |

### 4. Import Back to JSON
```bash
node csv-converter.js import
```

This updates `game_cards.json` with your changes.

---

## Adding New Cards

1. Add a new row to the CSV
2. Use a unique ID following the pattern:
   - `f-*` = Free cards
   - `p-*` = Premium cards
   - `lvl1-*` = Level 1 (Flirty)
   - `lvl2-*` = Level 2 (Warm)
   - `lvl3-*` = Level 3 (Spicy)
   - `lvl4-*` = Level 4 (Hot)
   - `lvl5-*` = Level 5 (Intense)
3. Fill in all required columns
4. Run `import`

## Removing Cards

1. Delete the row in the CSV
2. Run `import`

## Tips

- **Don't change existing IDs** — the app uses them to track cards
- **Use semicolons** in the `requires` column for multiple items: `ice;scarf;blindfold`
- **Quote marks** in content will be escaped automatically
- **Save as CSV** — not XLSX or other formats
- **Backup** — Copy the CSV before big edits

## Example New Card

```csv
lvl3-d-061,dare,"New spicy dare text here",3,intimate,true,5 min,ice,
lvl4-t-031,truth,"What's your darkest fantasy?",4,intimate,true,3 min,,"⚠️ Discuss boundaries first"
```

## Troubleshooting

**Import fails?**
- Check that all rows have the same number of columns
- Make sure `intensity` is a number (1-5)
- Make sure `isPremium` is exactly `true` or `false`

**Special characters?**
- Quotes in content: `"She said ""hello"" to me"`
- Commas in content: Just wrap in quotes: `"Do this, then that"`
- Newlines: Avoid them or use spaces

**Want to start over?**
```bash
node csv-converter.js export  # Re-export from JSON
```
