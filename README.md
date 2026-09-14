# Alin Adrian Ivana — Full Stack Developer Portfolio

Personal portfolio website for Alin Adrian Ivana, focused on Full Stack Development with Python and JavaScript.

**Live site:** https://www.alinadrian.dev

## Overview

The website presents my profile, technical skills, projects and contact information in ten languages: Romanian, English, Italian, Spanish, Turkish, German, Russian, French, Portuguese and Arabic.

## Main technologies

- HTML5 and CSS3
- JavaScript
- Python and Django
- MySQL / SQL
- REST and HTTP
- Git and GitHub

The portfolio also reflects my completed training in AI & Python Development and Frontend JavaScript Development, together with areas I am currently developing further.

## Website features

- responsive desktop and mobile layout
- Graphite and Light themes
- multilingual navigation with localized metadata
- local browser-based site assistant
- accessible reduced-motion behavior
- contact form that opens the visitor's email application
- canonical URLs, hreflang, Open Graph, Twitter metadata and JSON-LD
- GitHub Pages deployment with a custom domain

## Project structure

The Romanian pages are stored in the repository root. Other language versions are grouped in their respective folders. Shared styles and behavior are provided by `styles.css` and `script.js`, while the local site assistant uses the `chatbot-*` files.

## Run locally

From the project directory:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000` in a browser.

## Deployment

The site is designed to be published with GitHub Pages from the root of the `main` branch. The `CNAME` file keeps the custom domain configuration.
