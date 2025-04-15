const { invoke } = window.__TAURI__.core;
import { test } from './test.js';
let token = null;

// Variables globales pour le dessin des flèches
let arrows = [];
let isDrawing = false;
let currentArrow = null;
let startX, startY;
let isArrowToolActive = false; // Variable pour suivre si l'outil flèche est actif
let currentThickness = 7; // Valeur par défaut correspondant à l'option sélectionnée
let currentColor = '#FF0000'; // Rouge par défaut
let textAnnotations = [];
let isAddingText = false;
let currentTextInput = null;
let briefcase_id = null;
const canvas = document.getElementById('drawing-canvas');

const status_element = document.getElementById('status');
const link_button = document.getElementById('link-btn');
test();
// Dans votre main.js
console.log('Hello from JS');
window.__TAURI__.event.listen('capture_done', (event) => {
    console.log('listening');
    const base64 = event.payload;
    console.log("capture done");
    console.log(base64);
    document.getElementById('screenshot').src = base64;
});

window.__TAURI__.event.listen('capture_error', () => {
    console.error('Erreur lors de la capture');
});

console.log('Hello from frontend');
function enabled_link() {
    link_button.classList.toggle('text-gray-500');
    link_button.classList.toggle('text-gray-100');
    link_button.disabled = false;
}
async function processImageAnd(callback) {
    const canvas = await mergeScreenshotWithAnnotations();
    const base64 = canvas.toDataURL('image/png');
    await callback(base64);
}

document.addEventListener('DOMContentLoaded', () => {
    const btnbrief = document.getElementById('btn_briefcase');

    if(btnbrief) {
        console.log("btnbrief");

        btnbrief.addEventListener('click', brief_case_sellsy);
    }
    // ... votre code existant ...
    // Ajouter un bouton pour activer le mode texte
    const textButton = document.getElementById('text-button'); // Créez ce bouton dans votre HTML
    if (textButton) {
        textButton.addEventListener('click', enableTextMode);
    }

    if (link_button) {

        link_button.addEventListener("click", async () => {
            
            try {
                await processImageAnd(async (base64Data) => {
                    const result = await invoke("upload_base64_to_sellsy", {
                        token,
                        folderId: briefcase_id,
                        base64Data: base64Data
                    });
                    console.log("Résultat de l'envoi:", result);
                    greetMsgEl.textContent = result;
                    await invoke('copy_text_to_clipboard', {
                        link: result
                    });
                    showFeedback("📤 Image envoyée !");
                });
            } catch (error) {
                console.error("Erreur lors de l'envoi :", error);
                showFeedback("❌ Erreur envoi image");
            }
        });
    }


    // Gestion du sélecteur d'épaisseur
    const thicknessSelect = document.getElementById('arrow-thickness');
    thicknessSelect.addEventListener('change', (e) => {
        currentThickness = parseInt(e.target.value);
    });
    // Nouveau gestionnaire pour la couleur
    const colorPicker = document.getElementById('arrow-color');

    colorPicker.addEventListener('input', (e) => {
        currentColor = e.target.value;
    });
});

window.addEventListener('DOMContentLoaded', async () => {
    console.log('add event listener');
    try {
        const base64Image = await invoke('capture_base64');
        const img = document.getElementById('screenshot');
        img.src = base64Image;
    } catch (err) {
        console.error('Erreur lors de la capture :', err);
    }
});

// Dans votre main.js ou dans une balise script
document.addEventListener('DOMContentLoaded', () => {
    const settingsToggle = document.getElementById('settings-toggle');
    const settingsPanel = document.getElementById('settings-panel');
    const imageContainer = document.getElementById('image-wrapper');

    settingsToggle.addEventListener('click', () => {
        // Basculer la visibilité
        settingsPanel.classList.toggle('hidden');
        imageContainer.classList.toggle('hidden');
    });
});
document.addEventListener('DOMContentLoaded', () => {
    const arrowBtn = document.getElementById('btn_arrow');

    arrowBtn.addEventListener('click', () => {
        // Basculer la visibilité
        isArrowToolActive = true;
    });
});

// Appeler la fonction au chargement

let greetMsgEl = document.querySelector('#greet-msg');

const slogans = [
    'Shot Me Baby One More Time',
    'Oops, I clipped it again',
    'Colle-moi ça dans le ticket, chef',
    'Frais comme un guerdon, fumée comme un saumon',
    'Déposez. Décollez. Dégustez.',
    "99 bugs but a screenshot ain't one",
    'Tout déconne normalement ?',
    'Vintage support, future vision',
    'La décalcomanie va faire un four',
    'Vuela vuela',
    'La licence vaut bien quelques chocobons ?',
    'Le support ne dort jamais, il mange juste plus lentement',
];

async function brief_case_sellsy() {
    console.log("!!! brief case click !!!");
    const prelog = document.getElementById('prelog');
    console.log(prelog);
    try {
        
        briefcase_id = await invoke('get_folder_id', {token});
        prelog.textContent = JSON.stringify(briefcase_id);
        console.log(briefcase_id);
        
    } catch (error) {
        console.log(error);
    }
}
function getRandomSlogan() {
    const index = Math.floor(Math.random() * slogans.length);
    return slogans[index];
}

// Appliquer le slogan aléatoire
greetMsgEl.innerHTML = getRandomSlogan();

// async function copyImageToClipboard() {
//     const imgElement = document.getElementById('screenshot');

//     // Solution pour Tauri

//     try {
//         await invoke('copy_image_to_clipboard', {
//             base64Data: imgElement.src,
//         });
//         showFeedback('✓ Copié !');
//         return;
//     } catch (err) {
//         console.error('Erreur Tauri:', err);
//     }

//     // Fallback pour navigateur
//     try {
//         const canvas = document.createElement('canvas');
//         canvas.width = imgElement.naturalWidth;
//         canvas.height = imgElement.naturalHeight;

//         const ctx = canvas.getContext('2d');
//         ctx.drawImage(imgElement, 0, 0);

//         // Demande la permission si nécessaire
//         const permission = await navigator.permissions.query({
//             name: 'clipboard-write',
//         });

//         if (permission.state === 'granted' || permission.state === 'prompt') {
//             canvas.toBlob(async (blob) => {
//                 try {
//                     await navigator.clipboard.write([
//                         new ClipboardItem({
//                             'image/png': blob,
//                         }),
//                     ]);
//                     showFeedback('✓ Copié !');
//                 } catch (err) {
//                     console.error('Erreur Clipboard API:', err);
//                     downloadFallback(imgElement.src);
//                 }
//             }, 'image/png');
//         } else {
//             downloadFallback(imgElement.src);
//         }
//     } catch (err) {
//         console.error('Erreur générale:', err);
//         downloadFallback(imgElement.src);
//     }
// }

async function copyImageToClipboard() {
    const tempCanvas = await mergeScreenshotWithAnnotations();

    try {
        await invoke('copy_image_to_clipboard', {
            base64Data: tempCanvas.toDataURL('image/png'),
        });
        showFeedback('✓ Copié !');
    } catch (err) {
        console.error('Erreur Tauri:', err);
        // fallback navigateur
        try {
            const permission = await navigator.permissions.query({ name: 'clipboard-write' });
            if (permission.state === 'granted' || permission.state === 'prompt') {
                tempCanvas.toBlob(async (blob) => {
                    try {
                        await navigator.clipboard.write([
                            new ClipboardItem({ 'image/png': blob })
                        ]);
                        showFeedback('✓ Copié !');
                    } catch (err) {
                        console.error('Erreur Clipboard API:', err);
                        downloadFallback(tempCanvas.toDataURL('image/png'));
                    }
                }, 'image/png');
            } else {
                downloadFallback(tempCanvas.toDataURL('image/png'));
            }
        } catch (err) {
            console.error('Erreur générale:', err);
            downloadFallback(tempCanvas.toDataURL('image/png'));
        }
    }
}

/**
 * Fusionne l'image de fond (#screenshot) avec le canvas de dessin (#drawing-canvas)
 * et retourne un canvas avec le rendu final.
 * @returns {Promise<HTMLCanvasElement>}
 */
async function mergeScreenshotWithAnnotations() {
    const imgElement = document.getElementById('screenshot');
    const drawingCanvas = document.getElementById('drawing-canvas');

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = imgElement.naturalWidth;
    tempCanvas.height = imgElement.naturalHeight;

    const tempCtx = tempCanvas.getContext('2d');

    // Charger l'image de fond
    const img = new Image();
    img.src = imgElement.src;

    await new Promise((resolve) => {
        img.onload = resolve;
    });

    // Dessiner l'image d'arrière-plan
    tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);

    // Calcul du scale entre le canvas visible et la vraie image
    const scaleX = tempCanvas.width / drawingCanvas.width;
    const scaleY = tempCanvas.height / drawingCanvas.height;

    // Appliquer le scale
    tempCtx.save();
    tempCtx.scale(scaleX, scaleY);
    tempCtx.drawImage(drawingCanvas, 0, 0);
    tempCtx.restore();

    return tempCanvas;
}

function downloadFallback(base64Data) {
    const link = document.createElement('a');
    link.href = base64Data;
    link.download = 'capture-' + new Date().getTime() + '.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showFeedback('↓ Téléchargé (presse-papier bloqué)');
}

function showFeedback(message) {
    const feedback = document.createElement('div');
    feedback.textContent = message;
    feedback.className = 'fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-md shadow-lg';
    document.body.appendChild(feedback);
    setTimeout(() => feedback.remove(), 2000);
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('copy-btn').addEventListener('click', copyImageToClipboard);
});
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('connexion').addEventListener('click', getSellsyToken);
});
async function getSellsyToken() {
    const clientId = document.getElementById('clientId').value;
    const clientSecret = document.getElementById('clientSecret').value;

    try {
        const new_token = await invoke('get_sellsy_token', {
            clientId,
            clientSecret,
        });
        console.log('New Token:', token);
        token = `Bearer ${new_token}`;
        console.log('Token:', token);

        status_element.classList.toggle('text-yellow-500');
        status_element.classList.toggle('text-green-500');
        status_element.textContent = 'Connexion à Sellsy réussi !';
        enabled_link();
        return token;
    } catch (error) {
        console.error('Erreur:', error);
        return null;
    }
}
// Fonction pour sauvegarder les clés API
async function saveApiKeys(clientId, clientSecret) {
    try {
        await invoke('save_api_keys', { clientId, clientSecret });
        console.log('Clés API sauvegardées avec succès');
        return true;
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des clés API:', error);
        return false;
    }
}

// Fonction pour récupérer une clé API
async function getApiKey(keyName) {
    try {
        const value = await invoke('get_api_key', { keyName });
        return value;
    } catch (error) {
        console.error(`Erreur lors de la récupération de la clé ${keyName}:`, error);
        return null;
    }
}

// Fonction pour faire une requête API en utilisant les clés stockées
async function makeApiRequest(endpoint, params = {}) {
    try {
        const result = await invoke('make_api_request', {
            endpoint,
            ...params,
        });
        return result;
    } catch (error) {
        console.error('Erreur lors de la requête API:', error);
        throw error;
    }
}
async function initStore() {
    try {
        const result = await invoke('make_api_request', {
            endpoint,
            ...params,
        });
        return result;
    } catch (error) {
        console.error('Erreur lors de la requête API:', error);
        throw error;
    }
}

// Exemple d'utilisation dans un formulaire
document.addEventListener('DOMContentLoaded', () => {
    const apiKeyForm = document.getElementById('apiKeyForm');

    if (apiKeyForm) {
        apiKeyForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const clientId = document.getElementById('clientId').value;
            const clientSecret = document.getElementById('clientSecret').value;

            if (clientId && clientSecret) {
                const success = await saveApiKeys(clientId, clientSecret);

                if (success) {
                    // Mettre à jour l'UI pour indiquer le succès
                    status_element.classList.toggle('text-yellow-500');
                    status_element.classList.toggle('text-green-500');
                    status_element.textContent = 'Clés sauvegardées avec succès!';

                    // Tester une requête API
                    try {
                        const result = await makeApiRequest('https://api.example.com/data');
                        console.log('Résultat de la requête:', result);
                    } catch (error) {
                        console.error('Erreur lors du test de la requête:', error);
                    }
                }
            }
        });
    }

    // Exemple: Vérifier si les clés existent déjà au chargement
    async function checkExistingKeys() {
        const clientId = await getApiKey('client_id');
        if (clientId) {
            console.log('Clés API déjà configurées');
            document.getElementById('clientId').value = clientId;
        }
        const clientSecret = await getApiKey('client_secret');
        if (clientSecret) {
            document.getElementById('clientSecret').value = clientSecret;
        }
    }

    checkExistingKeys();
});

function initDrawing() {
    const canvas = document.getElementById('drawing-canvas');
    const img = document.getElementById('screenshot');
    const arrowButton = document.getElementById('btn_arrow');
    const textButton = document.getElementById('text-button');

    // Activer l'outil flèche lors du clic sur le bouton
    arrowButton.addEventListener('click', () => {
        isArrowToolActive = true;
        isAddingText = false; // Désactiver le mode texte

        // Mettre à jour visuellement le bouton comme étant actif
        document.querySelectorAll('.toolbar button').forEach((btn) => {
            btn.classList.remove('active-tool');
        });
        arrowButton.classList.add('active-tool');

        // Mettre à jour le curseur pour indiquer le mode de dessin
        canvas.style.cursor = 'crosshair';
    });

    // Activer l'outil texte lors du clic sur le bouton
    if (textButton) {
        textButton.addEventListener('click', enableTextMode);
    }

    // Ajout de l'écouteur d'événement pour le texte
    canvas.addEventListener('click', handleTextClick);

    // Activer l'outil flèche lors du clic sur le bouton
    arrowButton.addEventListener('click', () => {
        isArrowToolActive = true;
        // Mettre à jour visuellement le bouton comme étant actif
        document.querySelectorAll('.toolbar button').forEach((btn) => {
            btn.classList.remove('active-tool');
        });
        arrowButton.classList.add('active-tool');
        // Activer les événements sur le canvas
        canvas.style.pointerEvents = 'auto';
        // Mettre à jour le curseur pour indiquer le mode de dessin
        canvas.style.cursor = 'crosshair';
    });

    // Fonction pour ajuster le canvas à la taille et la position exacte de l'image
    function resizeCanvas() {
        const rect = img.getBoundingClientRect();

        // Crucial: s'assurer que les dimensions du canvas correspondent exactement à celles de l'image
        canvas.width = img.naturalWidth || rect.width;
        canvas.height = img.naturalHeight || rect.height;

        // Ajuster le style du canvas pour qu'il se superpose parfaitement à l'image
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;

        // Redessiner après redimensionnement
        redrawAllArrows();
    }

    // Appliquer le redimensionnement initial après chargement de l'image
    if (img.complete) {
        resizeCanvas();
    } else {
        img.onload = resizeCanvas;
    }

    // Ajouter un écouteur pour le redimensionnement de la fenêtre
    window.addEventListener('resize', resizeCanvas);

    // Gestion des événements
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', drawArrow);
    canvas.addEventListener('mouseup', endDrawing);
    canvas.addEventListener('mouseout', endDrawing);

    function startDrawing(e) {
        if (!isArrowToolActive) return;

        e.preventDefault();
        e.stopPropagation();

        isDrawing = true;
        const coords = getCanvasCoordinates(e);
        startX = coords.x;
        startY = coords.y;

        currentArrow = {
            start: { x: startX, y: startY },
            end: { x: startX, y: startY },
            color: currentColor,
            thickness: currentThickness, // Épaisseur par défaut
        };
    }

    function drawArrow(e) {
        if (!isArrowToolActive || !isDrawing) return;

        e.preventDefault();
        e.stopPropagation();

        const coords = getCanvasCoordinates(e);
        currentArrow.end = {
            x: coords.x,
            y: coords.y,
        };

        redrawAllArrows();
    }

    function endDrawing(e) {
        if (!isArrowToolActive || !isDrawing) return;

        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (currentArrow) {
            // Ne ajouter la flèche que si elle a une longueur minimale
            const dx = currentArrow.end.x - currentArrow.start.x;
            const dy = currentArrow.end.y - currentArrow.start.y;
            const length = Math.sqrt(dx * dx + dy * dy);

            if (length > 5) {
                // Longueur minimale en pixels
                arrows.push({ ...currentArrow });
            }
            currentArrow = null;
            redrawAllArrows();
        }
        isDrawing = false;
    }

    // Bouton pour effacer toutes les flèches
    const clearButton = document.getElementById('clear-arrows');
    if (clearButton) {
        clearButton.addEventListener('click', () => {
            arrows = [];
            textAnnotations = [];
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        });
    }

    // Permettre de désactiver l'outil flèche en cliquant sur d'autres outils
    const toolButtons = document.querySelectorAll('.toolbar button');
    toolButtons.forEach((button) => {
        if (button.id !== 'btn_arrow' && button.id !== 'clear-arrows') {
            button.addEventListener('click', () => {
                isArrowToolActive = false;
                arrowButton.classList.remove('active-tool');
                canvas.style.cursor = 'default';
            });
        }
    });
}

function drawSingleArrow(ctx, arrow) {
    // Calculer la taille de la pointe en fonction de l'épaisseur de la ligne
    const headLength = Math.max(10, arrow.thickness * 3); // Au moins 10px, ou 3 fois l'épaisseur
    const headWidth = Math.max(8, arrow.thickness * 2); // Au moins 8px, ou 2 fois l'épaisseur

    const angle = Math.atan2(arrow.end.y - arrow.start.y, arrow.end.x - arrow.start.x);

    // Dessine la ligne
    ctx.beginPath();
    ctx.moveTo(arrow.start.x, arrow.start.y);

    // Ajuster le point final de la ligne pour qu'elle ne se superpose pas à la pointe
    const lineEndX = arrow.end.x - (headLength / 2) * Math.cos(angle);
    const lineEndY = arrow.end.y - (headLength / 2) * Math.sin(angle);

    ctx.lineTo(lineEndX, lineEndY);
    ctx.lineWidth = arrow.thickness;
    ctx.strokeStyle = arrow.color;
    ctx.stroke();

    // Dessine la pointe de la flèche
    ctx.beginPath();
    ctx.moveTo(arrow.end.x, arrow.end.y); // Pointe de la flèche

    // Points de base de la pointe, avec angle ajusté en fonction de l'épaisseur
    const angleOffset = Math.PI / 6; // 30 degrés par défaut

    ctx.lineTo(arrow.end.x - headLength * Math.cos(angle - angleOffset), arrow.end.y - headLength * Math.sin(angle - angleOffset));

    // Point central de la base (pour créer une pointe plus large)
    ctx.lineTo(arrow.end.x - headLength * 0.7 * Math.cos(angle), arrow.end.y - headLength * 0.7 * Math.sin(angle));

    ctx.lineTo(arrow.end.x - headLength * Math.cos(angle + angleOffset), arrow.end.y - headLength * Math.sin(angle + angleOffset));

    ctx.closePath();
    ctx.fillStyle = arrow.color;
    ctx.fill();
}

function redrawAllArrows() {
    redrawCanvas();
    // const canvas = document.getElementById('drawing-canvas');
    // const ctx = canvas.getContext('2d');
    // ctx.clearRect(0, 0, canvas.width, canvas.height);

    // // Dessine toutes les flèches sauvegardées
    // arrows.forEach((arrow) => drawSingleArrow(ctx, arrow));

    // // Dessine la flèche en cours de dessin (si elle existe)
    // if (isDrawing && currentArrow) {
    //     drawSingleArrow(ctx, currentArrow);
    // }
}

// Ajoutons une fonction pour permettre à l'utilisateur de changer l'épaisseur
function createThicknessControl() {
    // Vérifier si le contrôle existe déjà
    if (document.getElementById('thickness-control')) return;

    // Créer le contrôle
    const control = document.createElement('div');
    control.id = 'thickness-control';
    control.style.cssText =
        'position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.7); padding: 10px; border-radius: 5px; z-index: 100; display: none;';

    // // Ajouter un label
    // const label = document.createElement('label');
    // label.textContent = 'Épaisseur: ';
    // label.style.color = 'white';
    // label.setAttribute('for', 'thickness-slider');
    // control.appendChild(label);

    // // Ajouter un slider
    // const slider = document.createElement('input');
    // slider.type = 'range';
    // slider.id = 'thickness-slider';
    // slider.min = '1';
    // slider.max = '15';
    // slider.value = '3';
    // slider.style.width = '100px';
    // control.appendChild(slider);

    // // Ajouter l'affichage de la valeur
    // const valueDisplay = document.createElement('span');
    // valueDisplay.id = 'thickness-value';
    // valueDisplay.textContent = '3';
    // valueDisplay.style.color = 'white';
    // valueDisplay.style.marginLeft = '5px';
    // control.appendChild(valueDisplay);

    // // Ajouter le contrôle au document
    // document.body.appendChild(control);

    // // Gérer le changement d'épaisseur
    // slider.addEventListener('input', function () {
    //     valueDisplay.textContent = this.value;
    //     // Mettre à jour l'épaisseur actuelle
    //     if (currentArrow) {
    //         currentArrow.thickness = parseInt(this.value);
    //         currentThickness = parseInt(this.value);
    //         redrawAllArrows();
    //     }
    // });

    // Montrer le contrôle quand l'outil flèche est activé
    document.getElementById('btn_arrow').addEventListener('click', function () {
        control.style.display = 'block';
    });

    // Cacher le contrôle quand un autre outil est sélectionné
    const otherTools = document.querySelectorAll('.toolbar button:not(#btn_arrow)');
    otherTools.forEach((tool) => {
        tool.addEventListener('click', function () {
            control.style.display = 'none';
        });
    });
}

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', () => {
    // Attendre un peu pour s'assurer que tout est chargé
    setTimeout(() => {
        initDrawing();
        createThicknessControl(); // Ajouter le contrôle d'épaisseur
    }, 100);
});

// Ajout de texte

// Fonction pour activer le mode texte
function enableTextMode() {
    isAddingText = true;
    isArrowToolActive = false; // Désactiver le mode flèche
    document.getElementById('drawing-canvas').style.cursor = 'text';

    // Mettre à jour visuellement les boutons
    document.querySelectorAll('.toolbar button').forEach((btn) => {
        btn.classList.remove('active-tool');
    });
    document.getElementById('text-button').classList.add('active-tool');
}

// Gestionnaire de clic pour ajouter du texte
function handleTextClick(e) {
    if (!isAddingText) return;

    e.preventDefault();
    e.stopPropagation();

    // Calculer les coordonnées relatives au canvas
    const coords = getCanvasCoordinates(e);
    const x = coords.x;
    const y = coords.y;

    // Position pour l'input dans la page (pas dans le canvas)
    const canvas = document.getElementById('drawing-canvas');
    const rect = canvas.getBoundingClientRect();
    const inputX = e.clientX;
    const inputY = e.clientY;

    // Créer un élément input pour entrer le texte
    const input = document.createElement('input');
    input.type = 'text';
    input.style.position = 'absolute';
    input.style.left = `${inputX}px`;
    input.style.top = `${inputY}px`;
    input.style.zIndex = '1000';
    input.style.background = 'rgba(255, 255, 255, 0.0)';
    // input.style.border = '1px dashed red';
    input.style.color = currentColor; // Utiliser la même couleur que pour les flèches
    // input.style.fontFamily = 'Arial';
    input.style.fontSize = `${16 * (currentThickness / 5)}px`;

    // Ajouter l'input au DOM
    document.body.appendChild(input);
    input.focus();

    // Stocker l'input courant et ses coordonnées
    currentTextInput = {
        element: input,
        x: x,
        y: y,
    };

    // Gérer la validation du texte (quand on appuie sur Entrée)
    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            finalizeTextInput();
        }
    });
    input.addEventListener('blur', function (e) {
        e.preventDefault();
        finalizeTextInput();
    });

    // Gérer le clic en dehors de l'input
    document.addEventListener('click', function clickOutside(event) {
        if (currentTextInput && event.target !== currentTextInput.element) {
            finalizeTextInput();
            // Retirer cet écouteur d'événement
            document.removeEventListener('click', clickOutside);
        }
    });
}

// Fonction pour finaliser l'ajout de texte
function finalizeTextInput() {
    if (!currentTextInput) return;

    const input = currentTextInput.element;

    // Ajouter le texte aux annotations si non vide
    if (input.value.trim() !== '') {
        textAnnotations.push({
            x: currentTextInput.x,
            y: currentTextInput.y,
            text: input.value,
            fontSize: 16 * (currentThickness / 5), // Ajuster la taille en fonction de l'épaisseur des flèches
            color: currentColor,
        });

        // Redessiner tout (flèches + texte)
        redrawCanvas();
    }

    // Supprimer l'input
    document.body.removeChild(input);
    currentTextInput = null;
}

// Fonction modifiée pour redessiner à la fois les flèches et le texte
function redrawCanvas() {
    const canvas = document.getElementById('drawing-canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dessiner toutes les flèches sauvegardées
    arrows.forEach((arrow) => drawSingleArrow(ctx, arrow));

    // Dessiner la flèche en cours de dessin (si elle existe)
    if (isDrawing && currentArrow) {
        drawSingleArrow(ctx, currentArrow);
    }

    // Dessiner toutes les annotations de texte
    for (const annotation of textAnnotations) {
        ctx.font = `${annotation.fontSize}px ${annotation.fontFamily || 'Arial'}`;
        ctx.fillStyle = annotation.color;
        ctx.textBaseline = 'top';
        ctx.fillText(annotation.text, annotation.x, annotation.y);
    }
}
function getCanvasCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    // Calculer le rapport d'échelle entre les dimensions du canvas et son affichage
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Convertir les coordonnées de l'événement en coordonnées canvas
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
    };
}

// Modifier la fonction copyImageToClipboard pour inclure le texte
// Pas besoin de changer si vous utilisez le même canvas pour tout
