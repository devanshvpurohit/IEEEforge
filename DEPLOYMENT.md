# Deployment Guide - Vercel

## 🚀 Quick Deploy to Vercel

Your IEEEForge app is ready to deploy to Vercel! Follow these steps:

### Method 1: Deploy via Vercel Dashboard (Recommended)

1. **Push to GitHub** ✅ (Already done!)
   - Your code is at: https://github.com/devanshvpurohit/IEEEforge.git

2. **Go to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Sign in with your GitHub account

3. **Import Project**
   - Click "Add New..." → "Project"
   - Select "Import Git Repository"
   - Choose `devanshvpurohit/IEEEforge`

4. **Configure Project**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)

5. **Add Environment Variables**
   Click "Environment Variables" and add:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   
   Get your Gemini API key from: https://makersuite.google.com/app/apikey

6. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for build to complete
   - Your app will be live at: `https://ieeeforge.vercel.app` (or similar)

---

### Method 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   cd /Users/devanshvpurohit/ieeeforge
   vercel
   ```

4. **Follow the prompts:**
   - Set up and deploy? `Y`
   - Which scope? (Select your account)
   - Link to existing project? `N`
   - What's your project's name? `ieeeforge`
   - In which directory is your code located? `./`
   - Want to override the settings? `N`

5. **Add Environment Variables**
   ```bash
   vercel env add GEMINI_API_KEY
   ```
   Paste your Gemini API key when prompted

6. **Deploy to Production**
   ```bash
   vercel --prod
   ```

---

## 🔧 Environment Variables

Your app requires the following environment variable:

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini AI API key for document analysis | Yes |

### Getting a Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and add it to Vercel

---

## 📋 Pre-Deployment Checklist

- [x] Code pushed to GitHub
- [x] Next.js configuration is correct
- [x] All dependencies are in package.json
- [x] Build command works locally (`npm run build`)
- [ ] Environment variables ready
- [ ] Gemini API key obtained
- [ ] Vercel account created

---

## 🎯 Post-Deployment Steps

### 1. Test Your Deployment
- Visit your Vercel URL
- Test file upload functionality
- Verify AI analysis works
- Test paper conversion
- Check preview modal
- Test downloads

### 2. Custom Domain (Optional)
- Go to your project settings in Vercel
- Navigate to "Domains"
- Add your custom domain
- Update DNS records as instructed

### 3. Set Up Analytics (Optional)
Vercel provides built-in analytics:
- Go to your project dashboard
- Click "Analytics" tab
- Enable Vercel Analytics

### 4. Configure Monitoring
- Set up error tracking (Sentry)
- Enable Vercel Speed Insights
- Monitor API usage

---

## 🔒 Security Considerations

### API Key Security
- ✅ Never commit `.env` files to Git
- ✅ Use Vercel's environment variables
- ✅ Rotate API keys periodically
- ✅ Monitor API usage in Google Cloud Console

### File Upload Limits
Vercel has the following limits:
- **Serverless Function Payload**: 4.5 MB (Hobby), 50 MB (Pro)
- **Execution Time**: 10s (Hobby), 60s (Pro)

If you need larger file support, consider:
1. Upgrading to Vercel Pro
2. Using external storage (AWS S3, Cloudinary)
3. Implementing chunked uploads

---

## 🐛 Troubleshooting

### Build Fails
```bash
# Test build locally first
npm run build

# Check for TypeScript errors
npm run lint
```

### Environment Variables Not Working
- Ensure variables are added in Vercel dashboard
- Redeploy after adding variables
- Check variable names match exactly

### API Errors
- Verify Gemini API key is valid
- Check API quota in Google Cloud Console
- Review Vercel function logs

### File Upload Issues
- Check file size limits
- Verify MIME types are allowed
- Review serverless function timeout

---

## 📊 Performance Optimization

### Recommended Settings

1. **Enable Edge Functions** (for faster response times)
2. **Configure Caching**
   ```typescript
   // In your API routes
   export const config = {
     runtime: 'edge', // or 'nodejs'
   };
   ```

3. **Optimize Images**
   - Use Next.js Image component
   - Enable automatic image optimization

4. **Enable Compression**
   - Vercel automatically compresses responses
   - No additional configuration needed

---

## 💰 Cost Estimation

### Vercel Pricing

**Hobby Plan (Free)**
- Perfect for personal projects
- 100 GB bandwidth/month
- Unlimited deployments
- 10s function execution time

**Pro Plan ($20/month)**
- Commercial projects
- 1 TB bandwidth/month
- 60s function execution time
- Priority support

### Gemini API Pricing
- Check current pricing at: https://ai.google.dev/pricing
- Free tier available for testing
- Pay-as-you-go for production

---

## 🔄 Continuous Deployment

Vercel automatically deploys when you push to GitHub:

1. **Push to main branch** → Production deployment
2. **Push to other branches** → Preview deployment
3. **Pull requests** → Automatic preview URLs

### Disable Auto-Deploy (Optional)
In Vercel dashboard:
- Project Settings → Git
- Uncheck "Production Branch"

---

## 📱 Mobile Optimization

Your app is already mobile-responsive, but verify:
- [ ] Test on iOS Safari
- [ ] Test on Android Chrome
- [ ] Check touch interactions
- [ ] Verify file upload on mobile
- [ ] Test preview modal on small screens

---

## 🎉 You're Ready to Deploy!

Your app is production-ready. Just follow Method 1 above to deploy to Vercel in minutes!

**Questions?** Check the [Vercel Documentation](https://vercel.com/docs) or open an issue on GitHub.
