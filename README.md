# ORIF Menu Website

## Overview

This is a French restaurant menu website for ORIF-POMY that displays daily menu items. The application features a responsive design with a sidebar navigation for different menu categories (daily specials, desserts, self-service, salads, vegetarian options, reviews, allergens, chef information, and hours). The site includes user authentication options and multi-language support (French, English, German).

## Project Structure

```
ORIF-POMY-MENU-CAFETERIA/
├── assets/
│   ├── app.js                 # Main JavaScript functions
│   ├── responsive.css         # Responsive design styles
│   └── style.css              # Main stylesheet
├── public/
│   ├── data/
│   │   ├── menus.json         # Menu data storage
│   │   └── vercel.json        # Vercel configuration
│   └── images/
│       ├── logo-orif.png      # ORIF logo
│       ├── Philippe_Etchebest.jpg  # Chef photo
│       └── plat_jour.jpg      # Daily dish image
├── admin.html                 # Admin interface
├── archive.html               # Menu history
├── index.html                 # Main page
├── login.html                 # Login page
├── .gitignore                 # Git ignore rules
└── README.md                  # This file
```

## Features

- **User Authentication**: Admin (ayesh.admin@orif.ch/0000) and Member (ayesh.benef@orif.ch/0000) accounts
- **Menu Management**: Complete admin interface for creating and managing daily menus
- **Rating System**: Members can rate and review menus
- **Chef Management**: Display and manage chef information
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Multi-language Support**: French, English, German interface options

## Technical Stack

- **Frontend**: Pure HTML, CSS, and JavaScript (no frameworks)
- **Storage**: LocalStorage for persistent data
- **Styling**: Custom CSS with responsive design
- **Authentication**: Simple role-based system

## Getting Started

1. Open `index.html` in a web browser
2. Use the demo credentials:
   - Admin: `ayesh.admin@orif.ch` / `0000`
   - Member: `ayesh.benef@orif.ch` / `0000`

## Development

The project uses a clean file structure with separated concerns:

- `/assets/` - JavaScript and CSS files
- `/public/data/` - JSON data files
- `/public/images/` - Static images
- HTML files at root level

## Recent Updates

- Completely eliminated JavaScript console errors
- Added consistent professional footer across all pages
- Implemented comprehensive menu creation and confirmation system
- Fixed role-based UI controls and member review functionality
- Enhanced responsive design for all screen sizes

## Deployment

The project is designed to work with static hosting providers like Vercel, Netlify, or GitHub Pages.

## License

© 2025 ORIF – Tous droits réservés