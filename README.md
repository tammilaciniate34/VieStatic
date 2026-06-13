## VieStatic 
Embed a scanable QR code in ANY website with VieStatic.  
**This README covers usage, usage for installation, tech stack, and licensing, along with previews.**  
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

---

## Features

* Lightweight and framework-independent
* Simple CDN integration
* Custom QR code destinations
* Multiple placement options
* Mobile-friendly
* MIT licensed


## A quick tip
If you want to change the link of the qrcode to something else, change data-url to your desired url. 
Also, VieStatic witll audo adapt to the same font you use for your website.


## Tech stack
The website is composed of cdn for qr-code-generator, html/css/js, and no other libs/frameworks except cdn for qr-code-generator. Explore.

## NPM
install with:
```bash
npm install viestatic
```
Package:
```https://www.npmjs.com/package/viestatic```

## Licensing
MIT license, feel free to remix/contribute. 

## Previews! 
<img width="79" height="89" alt="Screenshot 2026-06-12 at 11 02 07 AM" src="https://github.com/user-attachments/assets/fe8b2262-17a0-413c-b359-ec79e1ac1781" /> (watch what happens when you click the button with the preview below!)
<img width="358" height="337" alt="Screenshot 2026-06-12 at 11 03 28 AM" src="https://github.com/user-attachments/assets/51ed878a-e328-4d2b-b37f-f66452c77bb9" />
<img width="1918" height="957" alt="sssss" src="https://github.com/user-attachments/assets/0f9734f9-c7f3-4342-9c64-7a60e736a7d9" />


Note: Refer to SECURITY.md for instructions for bug/security reporting. 
Nota: Consulte SECURITY.md para obtener instrucciones sobre cómo reportar errores o problemas de seguridad.
Remarque : Consultez le fichier SECURITY.md pour savoir comment signaler des bugs ou des problèmes de sécurité.

**BE SURE TO SIGN UP FOR THE ICON COMPETITON. VISIT ICON.MD FOR INSTRUCTIONS!**

