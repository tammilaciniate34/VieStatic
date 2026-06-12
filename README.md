## VieStatic 
Embed a scanable QR code in ANY website with VieStatic.  
**This README covers usage, usage for installation, tech stack, and licensing, along with previews.**  

## Standard Usage
The standard usage happens like this, you load the CDN for the qr code generator, then you load the CDN for VieStatic.  
Embed this in your the <head> or <body> of HTML file:

```js
<script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js"></script>
<script src="https://viestatic.pages.dev/viestatic.js"
        data-pos="3"
        data-url="">
</script>
```
See in data-pos the little number which equals 3. You can change that to change the placement of the button!
The different locations are...
* 1 is bottom right
* 2 is bottom left
* 3 is top right
* 4 is top left

## Usage for local installation 
To use for local installation, it's a bit more complicated.  
Download the latest stable/LTS release of VieStatic. (Only download non-stable/non-LTS for cutting edge features)   
Then move the VieStatic installation into your project. Then embed this code block in the <head> or <body> sections of HTML file:
```js
<!-- QR Engine (CDN, required) -->
<script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js"></script>

<!-- Local VieStatic CSS -->
<link rel="stylesheet" href="/assets/viestatic.css">

<!-- Local VieStatic JS -->
<script src="/assets/viestatic.js"
        data-pos="3"
        data-url="">
</script>
```
(The guide above assumes your VieStatic installation is in /assets, you may change it accordingly. data pos rules still apply)

## A quick tip
If you want to change the link of the qrcode to something else, change data-url to your desired url.

## Tech stack
The website is composed of cdn for qr-code-generator, html/css/js, and no other libs/frameworks except cdn for qr-code-generator. 

## Licensing
MIT license, feel free to remix/contribute. 

## Previews! 
<img width="79" height="89" alt="Screenshot 2026-06-12 at 11 02 07 AM" src="https://github.com/user-attachments/assets/fe8b2262-17a0-413c-b359-ec79e1ac1781" /> (watch what happens when you click the button with the preview below!)
<img width="358" height="337" alt="Screenshot 2026-06-12 at 11 03 28 AM" src="https://github.com/user-attachments/assets/51ed878a-e328-4d2b-b37f-f66452c77bb9" />

Note: Refer to SECURITY.md for instructions for bug/security reporting. 
Nota: Consulte SECURITY.md para obtener instrucciones sobre cómo reportar errores o problemas de seguridad.
Remarque : Consultez le fichier SECURITY.md pour savoir comment signaler des bugs ou des problèmes de sécurité.

