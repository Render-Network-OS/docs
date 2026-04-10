# 🚀 RNDRNTWRK Documentation

Welcome to the official documentation for **RNDRNTWRK** - the future of sustainable streaming powered by blockchain technology.

[![Deployed with Mintlify](https://img.shields.io/badge/Deployed%20with-Mintlify-8B5CF6)](https://mintlify.com)
[![RNDRNTWRK](https://img.shields.io/badge/Platform-Render%20Network-0b8cb7)](https://rndrntwrk.com)

## 🌟 Overview

RNDRNTWRK is revolutionizing the streaming industry by combining gamification, blockchain technology, and interactive experiences. Our documentation provides comprehensive guides, API references, and resources for developers, streamers, and community members.

### 🎯 What You'll Find Here

- **📚 Getting Started**: Quick setup guides for new users
- **🎮 Products**: Detailed documentation for all RNDRNTWRK products
- **🔧 Guides**: Step-by-step tutorials and integration guides
- **💰 Tokenomics**: $555 token, creator staking, and the 10/20/70 model
- **👥 Community**: Resources for community engagement and support
- **🛠️ Development**: API documentation and developer tools

## 🏗️ Architecture

This documentation is built using [Mintlify](https://mintlify.com) - a modern documentation platform that provides:

- **⚡ Fast Development**: Hot-reload development server
- **🎨 Beautiful UI**: Responsive design with dark/light themes
- **🔍 Full-text Search**: Powerful search functionality
- **📱 Mobile-friendly**: Optimized for all devices
- **🚀 CDN Deployment**: Global content delivery
- **🔧 Customizable**: Extensive customization options

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ or npm/pnpm
- Git
- Mintlify CLI (optional for local development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/rndrntwrk/docs.git
   cd docs
   ```

2. **Install Mintlify CLI** (recommended)
   ```bash
   npm install -g mintlify
   ```

3. **Start development server**
   ```bash
   mint dev
   ```

4. **View your docs**
   - Open [http://localhost:3000](http://localhost:3000)
   - Hot-reload enabled for instant updates

### Alternative: Use without CLI

If you prefer not to install the CLI globally:

```bash
npx mintlify dev
```

## 📁 Project Structure

```
docs/
├── docs.json              # Main configuration file
├── index.mdx              # Landing page
├── quickstart.mdx         # Getting started guide
├── integration.mdx        # Integration guide
├── README.md             # This file
├── favicon.svg           # Site favicon
├── logo/                 # Brand assets
│   ├── light.svg        # Light theme logo
│   └── dark.svg         # Dark theme logo
├── guides/               # User guides
│   ├── wallet-setup.mdx
│   ├── obs-integration.mdx
│   ├── stream-configuration.mdx
│   ├── revenue-tracking.mdx
│   └── troubleshooting.mdx
├── products/             # Product documentation
│   ├── 555-gamification.mdx
│   ├── streaming-kit-marketplace.mdx
│   ├── stream-pack-generator.mdx
│   ├── animated-assets.mdx
│   └── monetization-module.mdx
├── tokenomics/           # Token economics
│   ├── overview.mdx
│   ├── 555-token.mdx
│   ├── creator-tokens.mdx
│   ├── fee-distribution.mdx
│   └── airdrops.mdx
└── community/            # Community resources
    ├── discord-server.mdx
    ├── twitter.mdx
    ├── support-center.mdx
    └── developer-resources.mdx
```

## 🎨 Customization

### Branding

The documentation uses RNDRNTWRK's official branding:

- **Primary Color**: `#0b8cb7` (Ocean Blue)
- **Secondary Color**: `#66cbfa` (Light Blue)
- **Accent Color**: `#f59f0b` (Amber)
- **Fonts**: System fonts for optimal performance

### Configuration

Edit `docs.json` to customize:

- Site metadata and branding
- Navigation structure
- Theme colors and appearance
- API integrations
- Analytics and tracking

Example configuration:
```json
{
  "name": "RNDRNTWRK",
  "colors": {
    "primary": "#0b8cb7",
    "light": "#66cbfa",
    "dark": "#0a7aa3"
  },
  "favicon": "/favicon.svg",
  "logo": {
    "light": "/logo/light.svg",
    "dark": "/logo/dark.svg"
  }
}
```

## 🚀 Deployment

### Automatic Deployment

Changes are automatically deployed when pushed to the `main` branch via GitHub Actions.

### Manual Deployment

1. **Build the site**
   ```bash
   mint build
   ```

2. **Deploy to hosting platform**
   - Vercel
   - Netlify
   - GitHub Pages
   - AWS S3/CloudFront

### Environment Variables

Set these environment variables for production:

```bash
# Analytics (optional)
MIXPANEL_TOKEN=your_mixpanel_token
GA_TRACKING_ID=your_ga_tracking_id

# Custom domain (optional)
CUSTOM_DOMAIN=rndrntwrk.com
```

## 🤝 Contributing

We welcome contributions from the community! Here's how to get involved:

### 🐛 Reporting Issues

- Use [GitHub Issues](https://github.com/rndrntwrk/docs/issues) for bug reports
- Include detailed steps to reproduce
- Attach screenshots or error logs when possible

### 📝 Contributing Content

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow the existing style and structure
   - Test locally with `mint dev`
   - Ensure all links and references are correct

4. **Submit a Pull Request**
   - Provide a clear description of changes
   - Reference any related issues
   - Keep docs-only PRs under 1000 changed lines when possible
   - Keep repo logic, workflow, config, and UI PRs under 400 changed lines
   - If a PR exceeds the guideline, explain why it could not be split smaller
   - Wait for review and approval

### 📚 Content Guidelines

- **Clear and Concise**: Use simple language
- **Well-structured**: Use headings, lists, and code blocks
- **Comprehensive**: Cover all use cases and edge cases
- **Up-to-date**: Keep information current with product changes
- **Accessible**: Use alt text for images and semantic markup

### 🎨 Design Guidelines

- **Consistent Branding**: Use RNDRNTWRK colors and fonts
- **Mobile-first**: Ensure content works on all devices
- **Fast Loading**: Optimize images and avoid heavy assets
- **User-friendly**: Clear navigation and intuitive structure

## 🔧 Development

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Available Scripts

- `mint dev` - Start development server
- `mint build` - Build for production
- `mint preview` - Preview production build
- `mint update` - Update Mintlify CLI

### Code Style

- Use MDX for content files
- Follow standard Markdown conventions
- Use semantic HTML in JSX components
- Maintain consistent heading hierarchy
- Include alt text for all images

## 🐛 Troubleshooting

### Common Issues

**❌ "Command not found: mint"**
```bash
# Install Mintlify CLI
npm install -g mintlify

# Or use npx
npx mintlify dev
```

**❌ "Port 3000 already in use"**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
mint dev --port 3001
```

**❌ "docs.json not found"**
- Ensure you're in the correct directory
- Check that `docs.json` exists in the root
- Verify file is valid JSON

**❌ "Build failed"**
- Check for syntax errors in MDX files
- Verify all image paths are correct
- Ensure all links are valid

### Getting Help

- 📖 [Mintlify Documentation](https://mintlify.com/docs)
- 🐛 [GitHub Issues](https://github.com/rndrntwrk/docs/issues)
- 💬 [Discord Community](https://discord.gg/35UNPtu8M5)
- 📧 [Support Email](mailto:support@rndrntwrk.com)

## 📊 Analytics & Monitoring

The documentation includes built-in analytics to track:

- Page views and user engagement
- Search queries and popular content
- User feedback and ratings
- Performance metrics

### Custom Analytics

Add your own analytics by editing `docs.json`:

```json
{
  "integrations": {
    "analytics": {
      "mixpanel": {
        "token": "your_mixpanel_token"
      },
      "googleAnalytics": {
        "trackingId": "your_ga_tracking_id"
      }
    }
  }
}
```

## 🔒 Security

- All documentation is open source and publicly accessible
- No sensitive information is stored in the repository
- API keys and tokens are managed through environment variables
- Regular security audits and dependency updates

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Mintlify** for the amazing documentation platform
- **RNDRNTWRK Community** for valuable feedback and contributions
- **Open Source Community** for tools and inspiration

## 🎯 Roadmap

### 🚀 Upcoming Features

- [ ] Interactive code examples
- [ ] Multi-language support (i18n)
- [ ] Advanced search with filters
- [ ] User feedback system
- [ ] Integration with RNDRNTWRK API
- [ ] Automated content validation
- [ ] Performance optimization tools

### 🔄 Recent Updates

- ✅ Complete branding overhaul
- ✅ Comprehensive product documentation
- ✅ Advanced integration guides
- ✅ Tokenomics documentation
- ✅ Community resources
- ✅ Mobile-responsive design

---

**Built with ❤️ by the RNDRNTWRK Team**

🌐 [rndrntwrk.com](https://rndrntwrk.com) • 📧 [support@rndrntwrk.com](mailto:support@rndrntwrk.com) • 💬 [Discord](https://discord.gg/35UNPtu8M5)
