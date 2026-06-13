## VieStatic 
Embed a scannable QR code in ANY website with VieStatic.  
**This README covers usage, usage for installation, tech stack, and licensing, along with previews.**  
[![npm version](https://img.shields.io/npm/v/viestatic.svg)](https://www.npmjs.com/package/viestatic) [![npm downloads](https://img.shields.io/npm/dm/viestatic.svg)](https://www.npmjs.com/package/viestatic) [![license MIT](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/live-by-unix/VieStatic/blob/main/LICENSE)

## What VieStatic is
VieStatic is a lightweight QR code widget that can be embedded in any website, including static sites, React, Astro, and Node.js projects via CDN, local files, or npm.

## Features

* Lightweight and framework-independent
* Simple CDN integration
* Custom QR code destinations
* Multiple placement options
* Mobile-friendly
* MIT licensed
* Inherits your website’s font styles where possible

## Installation (CDN)

Add the following code to the `<head>` or '<body>' section of your HTML document:

```html
<link rel="stylesheet" href="https://viestatic.pages.dev/viestatic.css">

<script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js"></script>

<script src="https://viestatic.pages.dev/viestatic.js"
        data-pos="3"
        data-url="">
</script>
```

### Configuration

#### `data-pos`

Controls the position of the VieStatic button.

| Value | Position     |
| ----- | ------------ |
| 1     | Bottom Right |
| 2     | Bottom Left  |
| 3     | Top Right    |
| 4     | Top Left     |

#### `data-url`

Specifies the URL that will be encoded into the QR code.

If left empty, VieStatic will use the current page URL automatically.

If you want to change the link of the QR code to something else, change data-url to your desired url (https:// included). 

---

## Local Installation

1. Download the latest stable release of VieStatic.
2. Place `viestatic.css` and `viestatic.js` inside your project.
3. Add the following code to your HTML document:

```html
<script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js"></script>

<link rel="stylesheet" href="/assets/viestatic.css">

<script src="/assets/viestatic.js"
        data-pos="3"
        data-url="">
</script>
```

> This example assumes the files are stored in `/assets`. Adjust the paths as needed.

---

## NPM Installation

```bash
npm install viestatic
```
After installation, import VieStatic according to your project's setup.

Package URL:
https://www.npmjs.com/package/viestatic

---

## Usage Notes
* Best used on login flows, landing pages, social platforms, and mobile-first websites.
* Works automatically with the current page URL if data-url is omitted
* Position can be adjusted using data-pos

## Tech stack
Built with vanilla HTML, CSS, and JavaScript.
Uses qrcode-generator via CDN.


## Licensing
MIT License — free to use, modify, and distribute

## Previews of website!
<img width="79" height="89" alt="Screenshot 2026-06-12 at 11 02 07 AM" src="https://github.com/user-attachments/assets/fe8b2262-17a0-413c-b359-ec79e1ac1781" /> 

<img width="358" height="337" alt="Screenshot 2026-06-12 at 11 03 28 AM" src="https://github.com/user-attachments/assets/51ed878a-e328-4d2b-b37f-f66452c77bb9" />

<img width="1918" height="957" alt="sssss" src="https://github.com/user-attachments/assets/0f9734f9-c7f3-4342-9c64-7a60e736a7d9" />


Note: Refer to SECURITY.md for instructions for bug/security reporting. 
Nota: Consulte SECURITY.md para obtener instrucciones sobre cómo reportar errores o problemas de seguridad.
Remarque : Consultez le fichier SECURITY.md pour savoir comment signaler des bugs ou des problèmes de sécurité.

