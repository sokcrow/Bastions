// Plantilla base para el usuario
const defaultState = {
    merit: 0,
    // Aquí puedes añadir todos los Rasgos de tu árbol de habilidades
    traits: [
        {
            id: 'nodo_raiz_ejemplo', // ID único
            nombreBase: 'Rasgo Inicial', // Nombre que se mostrará
            nivel: 0, // Inicia en 0
            costeMerito: [10, 25], // [Costo para +, Costo para ++]
            desbloqueado: true, // true si es la raíz o si no tiene requisitos
            requisitos: [], // IDs de los rasgos padres necesarios
            tier: 1 // Nivel de profundidad visual en el árbol (1 es arriba)
        },
        {
            id: 'nodo_hijo_ejemplo',
            nombreBase: 'Rasgo Secundario',
            nivel: 0,
            costeMerito: [15, 30],
            desbloqueado: false, // Inicia false si depende de otro
            requisitos: ['nodo_raiz_ejemplo'], // ID del nodo del que depende
            tier: 2
        }
    ],
    // Aquí puedes añadir todos los Estados independientes del personaje
    estados: [
        {
            id: 'estado_fuerza', // ID único
            nombreBase: 'Fuerza Bruta',
            descripcion: 'Aumenta el daño físico base.',
            nivel: 0,
            costeMerito: [20, 40], // [Costo para +, Costo para ++]
            desbloqueado: true // Los estados suelen estar disponibles desde el inicio, pon false si requieres lógica especial
        },
        {
            id: 'estado_resistencia',
            nombreBase: 'Resistencia al Dolor',
            descripcion: 'Reduce el daño recibido en un 5%.',
            nivel: 0,
            costeMerito: [15, 35],
            desbloqueado: true
        }
    ]
};

let gameState = null;

// Inicialización
function init() {
    loadGameState();
    renderTree();
    renderStates();
    updateMeritDisplay();
    setupEventListeners();

    // Dibujar líneas si la pestaña de rasgos está activa
    if (document.getElementById('tab-rasgos').classList.contains('active')) {
        setTimeout(drawLines, 50);
    }
}

// Cargar estado de localStorage
function loadGameState() {
    const savedState = localStorage.getItem('skillTreeState');
    if (savedState) {
        gameState = JSON.parse(savedState);
    } else {
        // Copia profunda del estado inicial
        gameState = JSON.parse(JSON.stringify(defaultState));
    }

    // Recalcular estado de desbloqueo basado en los requisitos (solo para rasgos)
    recalculateUnlockedStates();
}

// Guardar estado en localStorage
function saveGameState() {
    localStorage.setItem('skillTreeState', JSON.stringify(gameState));
}

// Actualizar estados "desbloqueado" según los requisitos en Rasgos
function recalculateUnlockedStates() {
    gameState.traits.forEach(trait => {
        if (trait.requisitos.length === 0) {
            trait.desbloqueado = true; // Raíz siempre disponible
        } else {
            // Un rasgo está desbloqueado si TODOS sus requisitos tienen al menos nivel 1
            const allReqsMet = trait.requisitos.every(reqId => {
                const reqTrait = gameState.traits.find(t => t.id === reqId);
                return reqTrait && reqTrait.nivel > 0;
            });
            trait.desbloqueado = allReqsMet;
        }
    });
}

// Obtener sufijo de nivel
function getLevelSuffix(nivel) {
    if (nivel === 1) return "+";
    if (nivel === 2) return "++";
    return "";
}

// Obtener texto de coste
function getCurrentCost(item) {
    if (item.nivel >= 2) return "MÁXIMO";
    return item.costeMerito[item.nivel] + " Mérito";
}

// ==========================================
// RENDERIZADO DE RASGOS (ÁRBOL)
// ==========================================
function renderTree() {
    const container = document.getElementById('nodes-container');
    container.innerHTML = '';

    // Agrupar por tiers
    const tiers = {};
    gameState.traits.forEach(trait => {
        if (!tiers[trait.tier]) {
            tiers[trait.tier] = [];
        }
        tiers[trait.tier].push(trait);
    });

    // Crear elementos DOM
    const sortedTiers = Object.keys(tiers).sort((a, b) => parseInt(a) - parseInt(b));

    sortedTiers.forEach(tierKey => {
        const tierDiv = document.createElement('div');
        tierDiv.className = 'tier';

        tiers[tierKey].forEach(trait => {
            const node = document.createElement('div');
            node.className = 'node';
            node.id = `node-${trait.id}`;

            // Clases de estado
            if (trait.nivel === 2) {
                node.classList.add('maxed');
            } else if (trait.desbloqueado) {
                node.classList.add('unlocked');
            } else {
                node.classList.add('locked');
            }

            const name = trait.nombreBase + getLevelSuffix(trait.nivel);
            const costText = getCurrentCost(trait);

            node.innerHTML = `
                <div class="node-name">${name}</div>
                <div class="node-cost">${costText}</div>
            `;

            // Evento click
            node.addEventListener('click', () => handleUpgrade(trait, 'trait'));

            tierDiv.appendChild(node);
        });

        container.appendChild(tierDiv);
    });
}

// ==========================================
// RENDERIZADO DE ESTADOS (CUADRÍCULA)
// ==========================================
function renderStates() {
    const container = document.getElementById('states-container');
    container.innerHTML = '';

    // Si no hay estados definidos
    if (!gameState.estados || gameState.estados.length === 0) {
        container.innerHTML = '<p style="color:#aaa;">No hay estados definidos aún.</p>';
        return;
    }

    gameState.estados.forEach(estado => {
        const card = document.createElement('div');
        card.className = 'state-card';
        card.id = `state-${estado.id}`;

        // Clases de estado
        if (estado.nivel === 2) {
            card.classList.add('maxed');
        } else if (estado.desbloqueado) {
            card.classList.add('unlocked');
        } else {
            card.classList.add('locked');
        }

        const name = estado.nombreBase + getLevelSuffix(estado.nivel);
        const costText = getCurrentCost(estado);
        const descText = estado.descripcion || '';

        card.innerHTML = `
            <div class="state-name">${name}</div>
            <div class="state-cost">${costText}</div>
            ${descText ? `<div class="state-desc">${descText}</div>` : ''}
        `;

        // Evento click
        card.addEventListener('click', () => handleUpgrade(estado, 'state'));

        container.appendChild(card);
    });
}

// ==========================================
// LÓGICA DE MEJORA UNIFICADA
// ==========================================
function handleUpgrade(item, type) {
    // Si no está desbloqueado o ya está al máximo
    if (!item.desbloqueado || item.nivel >= 2) {
        shakeElement(type === 'trait' ? `node-${item.id}` : `state-${item.id}`);
        return;
    }

    const cost = item.costeMerito[item.nivel];

    // Verificar si hay mérito suficiente
    if (gameState.merit >= cost) {
        // Restar mérito
        gameState.merit -= cost;

        // Subir nivel
        item.nivel++;

        if (type === 'trait') {
            recalculateUnlockedStates();
            renderTree();
            // Redibujar líneas si estamos en la pestaña de rasgos
            if (document.getElementById('tab-rasgos').classList.contains('active')) {
                setTimeout(drawLines, 50);
            }
        } else {
            renderStates();
        }

        saveGameState();
        updateMeritDisplay();

    } else {
        // Efecto visual de no poder comprar por falta de fondos
        shakeElement(type === 'trait' ? `node-${item.id}` : `state-${item.id}`);
    }
}

// Efecto visual cuando no se puede interactuar/comprar
function shakeElement(elementId) {
    const el = document.getElementById(elementId);
    if (el) {
        el.style.transform = "translateX(-5px)";
        setTimeout(() => el.style.transform = "translateX(5px)", 100);
        setTimeout(() => el.style.transform = "translateX(0)", 200);
    }
}

// Actualizar visualización de mérito
function updateMeritDisplay() {
    document.getElementById('merit-count').textContent = gameState.merit;
}

// ==========================================
// DIBUJO DE LÍNEAS SVG (Solo Rasgos)
// ==========================================
function drawLines() {
    const svg = document.getElementById('connections-svg');
    if (!svg) return;

    svg.innerHTML = ''; // Limpiar líneas anteriores

    // Solo dibujar si la pestaña está visible (para que los cálculos de boundingRect sean correctos)
    if (!document.getElementById('tab-rasgos').classList.contains('active')) return;

    gameState.traits.forEach(trait => {
        if (trait.requisitos && trait.requisitos.length > 0) {
            const targetNode = document.getElementById(`node-${trait.id}`);

            if (!targetNode) return;

            trait.requisitos.forEach(reqId => {
                const sourceNode = document.getElementById(`node-${reqId}`);

                if (!sourceNode) return;

                // Calcular centros
                const sourceRect = sourceNode.getBoundingClientRect();
                const targetRect = targetNode.getBoundingClientRect();
                const svgRect = svg.getBoundingClientRect();

                const startX = sourceRect.left + sourceRect.width / 2 - svgRect.left;
                const startY = sourceRect.bottom - svgRect.top;

                const endX = targetRect.left + targetRect.width / 2 - svgRect.left;
                const endY = targetRect.top - svgRect.top;

                // Crear línea
                const line = document.createElementNS("http://www.w3.org/2000/svg", "path");

                // Curva de bezier cúbica
                const pathData = `M ${startX} ${startY} C ${startX} ${startY + 40}, ${endX} ${endY - 40}, ${endX} ${endY}`;
                line.setAttribute("d", pathData);

                // Determinar estado de la línea
                const reqTrait = gameState.traits.find(t => t.id === reqId);
                const isReqMet = reqTrait && reqTrait.nivel > 0;

                const isActive = isReqMet && (trait.desbloqueado || trait.nivel > 0);

                line.setAttribute("class", `connection-line ${isActive ? 'active' : 'inactive'}`);
                line.setAttribute("fill", "none");

                svg.appendChild(line);
            });
        }
    });
}

// ==========================================
// EVENTOS (Pestañas y Botones)
// ==========================================
function setupEventListeners() {
    // Botones de sistema (Mérito y Reset)
    document.getElementById('add-merit-btn').addEventListener('click', () => {
        gameState.merit += 10;
        saveGameState();
        updateMeritDisplay();
    });

    document.getElementById('reset-btn').addEventListener('click', () => {
        if(confirm("¿Estás seguro de que deseas reiniciar todo el progreso?")) {
            localStorage.removeItem('skillTreeState');
            location.reload();
        }
    });

    // Navegación por pestañas
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Quitar clase active de todos
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Añadir clase active al clickeado y su target
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');

            // Si pasamos a la pestaña de rasgos, redibujamos las líneas porque el layout cambió
            if (targetId === 'tab-rasgos') {
                setTimeout(drawLines, 50);
            }
        });
    });

    // Resize para redibujar las líneas
    window.addEventListener('resize', () => {
        // Solo recalcular si la pestaña de rasgos está activa
        if (document.getElementById('tab-rasgos').classList.contains('active')) {
            drawLines();
        }
    });
}

// Iniciar aplicación al cargar
document.addEventListener('DOMContentLoaded', init);
