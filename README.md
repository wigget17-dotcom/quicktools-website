# QuickTools Platform V2

This repository contains the QuickTools static website platform for software tools and digital products.

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript

## Scope

- Multi-page professional platform design
- Modern homepage with hero, statistics, featured sections, categories, latest releases, testimonials placeholder, and newsletter placeholder
- Tools page with automatic config-driven cards
- Digital Products page with automatic config-driven cards
- Category page and legal/company pages
- Global navigation: Home, Tools, Digital Products, Categories, About, Contact, Privacy, Terms
- Search support for tools and products
- Filtering support: category, status, newest, featured
- Status badges: Available, Coming Soon, Beta, Maintenance, Unavailable
- Light and dark mode with user preference persistence
- Newest Tools, Newest Products, Featured sections, and statistics generated from config

No backend, login, database, or paid APIs are used.

## Folder Structure

```text
Website/
  index.html
  tools.html
  products.html
  categories.html
  about.html
  contact.html
  privacy.html
  terms.html
  style.css
  script.js
  README.md
  assets/
    icons/
    images/
    fonts/
  css/
  js/
  tools/
    index.json
    qr-code-generator/
      config.json
      index.html
      assets/
    invoice-generator/
      config.json
      index.html
      assets/
    password-generator/
      config.json
      index.html
      assets/
    barcode-generator/
      config.json
      index.html
      assets/
    vat-calculator/
      config.json
      index.html
      assets/
    whatsapp-link-generator/
      config.json
      index.html
      assets/
    image-tools/
      config.json
      index.html
      assets/
    pdf-tools/
      config.json
      index.html
      assets/
    unit-converter/
      config.json
      index.html
      assets/
    text-tools/
      config.json
      index.html
      assets/
  products/
    index.json
    planners/
      config.json
      thumbnail.webp
      download.pdf
    diaries/
      config.json
      thumbnail.webp
      download.pdf
    templates/
      config.json
      thumbnail.webp
      download.pdf
    ebooks/
      config.json
      thumbnail.webp
      download.pdf
    journals/
      config.json
      thumbnail.webp
      download.pdf
    business/
      config.json
      thumbnail.webp
      download.pdf
    checklists/
      config.json
      thumbnail.webp
      download.pdf
    worksheets/
      config.json
      thumbnail.webp
      download.pdf
    coloring-books/
      config.json
      thumbnail.webp
      download.pdf
  categories/
    index.json
    planners.json
    diaries.json
    templates.json
    ebooks.json
    journals.json
    business.json
    checklists.json
    worksheets.json
    coloring-books.json
  shared/
  .vscode/
    settings.json
    extensions.json
```

## Automatic Data Loading

- Tools are loaded from tools/index.json and each tool folder config.json.
- Products are loaded from products/index.json and each product folder config.json.
- Cards and featured sections are generated dynamically in JavaScript.
- Statistics are generated dynamically from loaded configs.

## Required Config Schema

All tool and product config.json files support:

- name
- description
- category
- status
- featured
- version
- icon
- thumbnail
- author
- created
- updated
- tags
- download
- url

## Admin Workflow

To add a new tool or product:

1. Create a new folder in tools or products.
2. Add required files (config.json and content files).
3. Refresh the website.

The UI sections (featured, newest, search, filters, and stats) are generated from configuration data.

## Static Hosting Compatibility

This project is fully static and hosting-ready for free platforms such as:

- GitHub Pages
- Netlify
- Cloudflare Pages
- Vercel (static)

### Deployment Notes

- Entry file is index.html at project root.
- All references use relative paths.
- No server runtime or build step is required.
