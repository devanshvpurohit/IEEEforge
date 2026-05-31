# IEEEForge - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Start the Development Server
```bash
npm run dev
```

### Step 2: Configure AI Settings
1. Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
2. Click **Settings** button
3. Choose your AI provider:

**Option A: Gemini (Cloud)**
- Get API key: [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey)
- Paste key in Settings
- Click **Save Settings**

**Option B: Ollama (Local)**
```bash
# In a separate terminal
ollama serve

# Pull a model
ollama pull llama3.2
```
- Click **Refresh** in Settings
- Select model
- Click **Save Settings**

### Step 3: Convert Your Paper
**Method 1: Upload Document**
- Upload PDF/DOCX/TXT/MD file
- Wait for analysis
- Click **Convert to IEEE Paper**

**Method 2: Use Paper Assistant**
- Answer questions in the chat
- Add images (optional)
- Click **Generate IEEE Paper**

---

## 📦 Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm start                # Start production server
npm run lint             # Run linter

# Ollama (if using local AI)
ollama serve             # Start Ollama server
ollama pull llama3.2     # Download model
ollama list              # List installed models
```

---

## 🎯 Supported File Formats

**Input:**
- PDF (`.pdf`)
- Microsoft Word (`.docx`)
- Plain Text (`.txt`)
- Markdown (`.md`)

**Output:**
- DOCX (Microsoft Word)
- LaTeX (IEEE template)
- TXT (Plain text)
- JSON (Structured data)

---

## ⚡ Quick Tips

1. **Faster Processing**: Use Gemini for faster results
2. **Privacy**: Use Ollama for local processing
3. **Better Results**: Provide more detail in Paper Assistant
4. **Images**: Add up to 6 figures for better papers
5. **Preview**: Use Preview button before downloading

---

## 🐛 Quick Fixes

**Problem: "API key invalid"**
```
Solution: Get new key from https://aistudio.google.com/apikey
```

**Problem: "Ollama not found"**
```bash
# Run in terminal
ollama serve
```

**Problem: "No models"**
```bash
# Install a model
ollama pull llama3.2
```

**Problem: Build errors**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## 📊 What You Get

✅ Complete IEEE-formatted paper
✅ Title, Authors, Abstract
✅ Introduction, Methodology, Results, Conclusion
✅ IEEE-style references
✅ Figure captions
✅ Keywords/Index terms
✅ Publication-ready format

---

## 🎉 That's It!

You're ready to convert research papers to IEEE format.

**Need more help?** See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed documentation.
