# IEEEForge 📄✨

Transform your research reports into publication-ready IEEE papers with AI-powered formatting, citation management, and quality analysis.

![IEEEForge Banner](https://img.shields.io/badge/AI-Powered-gold?style=for-the-badge) ![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)

## 🚀 Features

- **Smart Section Extraction** - AI automatically detects and reorganizes content into IEEE-standard sections
- **Citation Management** - Convert any citation style (APA, MLA, Chicago) into IEEE format
- **Readiness Analysis** - Get AI-powered publication readiness scores with actionable feedback
- **Multiple Format Support** - Upload PDF, DOCX, TXT, or Markdown files
- **Export Options** - Download as TXT or JSON format
- **Live Preview** - Preview your converted IEEE paper before downloading
- **Quality Assurance** - AI checks for missing sections and compliance issues

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: Custom components with Radix UI primitives
- **Animations**: Framer Motion
- **AI Engine**: Google Gemini AI
- **Document Parsing**: pdf-parse, mammoth

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ieeeforge.git
cd ieeeforge
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🔑 Getting a Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key and add it to your `.env.local` file

## 📖 Usage

1. **Upload Document**: Navigate to the Dashboard and upload your research report (PDF, DOCX, TXT, or MD)
2. **AI Analysis**: The system analyzes your document and provides:
   - Word count and estimated pages
   - Publication readiness score
   - Detected sections
   - Missing sections
   - Research domain and technical complexity
3. **Convert to IEEE**: Click "Convert to IEEE Paper" to transform your document
4. **Preview**: Use the "Preview Paper" button to see the formatted IEEE paper
5. **Download**: Export your paper as TXT or JSON format

## 🎨 UI/UX Highlights

- **Modern Design**: Clean, minimalist interface with smooth animations
- **Responsive**: Works seamlessly on desktop, tablet, and mobile
- **Accessibility**: WCAG compliant with proper ARIA labels
- **Dark Mode Ready**: Prepared for dark mode implementation
- **Loading States**: Clear feedback during processing
- **Error Handling**: User-friendly error messages

## 📁 Project Structure

```
ieeeforge/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── upload/       # Document upload endpoint
│   │   │   ├── convert/      # IEEE conversion endpoint
│   │   │   └── export/       # Export endpoints
│   │   ├── dashboard/        # Main dashboard page
│   │   ├── page.tsx          # Landing page
│   │   └── layout.tsx        # Root layout
│   ├── components/
│   │   ├── ui/               # Reusable UI components
│   │   ├── header.tsx        # Navigation header
│   │   ├── footer.tsx        # Footer component
│   │   └── paper-preview-modal.tsx
│   └── lib/
│       ├── ai-engine.ts      # AI processing logic
│       ├── document-parser.ts # Document parsing utilities
│       └── utils.ts          # Helper functions
├── public/                   # Static assets
└── package.json
```

## 🔧 Configuration

### AI Settings

Users can configure their own Gemini API key in the Dashboard settings panel. If no key is provided, the system uses the server's default key.

### Supported File Types

- PDF (`.pdf`)
- Microsoft Word (`.docx`)
- Plain Text (`.txt`)
- Markdown (`.md`)

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Add your `GEMINI_API_KEY` environment variable
4. Deploy!

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Railway
- Render

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Google Gemini AI for powering the intelligent document analysis
- Next.js team for the amazing framework
- Tailwind CSS for the utility-first styling approach
- Framer Motion for smooth animations

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

Made with ❤️ by the IEEEForge Team
