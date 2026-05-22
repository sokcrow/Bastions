// Estado Inicial
const defaultState = {
    merit: 0,
    traits: [
        {
            id: 'vitality',
            nombreBase: 'Fuerza Vital',
            nivel: 0,
            costeMerito: [10, 25],
            desbloqueado: true,
            requisitos: [],
            tier: 1 // Usado para agrupar visualmente en la interfaz
        },
        {
            id: 'strength',
            nombreBase: 'Poder Físico',
            nivel: 0,
            costeMerito: [15, 30],
            desbloqueado: false,
            requisitos: ['vitality'],
            tier: 2
        },
        {
            id: 'agility',
            nombreBase: 'Agilidad',
            nivel: 0,
            costeMerito: [15, 30],
            desbloqueado: false,
            requisitos: ['vitality'],
            tier: 2
        },
        {
            id: 'reflexes',
            nombreBase: 'Reflejos Mejorados',
            nivel: 0,
            costeMerito: [20, 40],
            desbloqueado: false,
            requisitos: ['agility'],
            tier: 3
        },
        {
            id: 'titan',
            nombreBase: 'Cuerpo de Titán',
            nivel: 0,
            costeMerito: [30, 50],
            desbloqueado: false,
            requisitos: ['strength', 'vitality'], // Requiere nivel en ambos
            tier: 3
        },
        {
            id: 'mastery',
            nombreBase: 'Maestría Total',
            nivel: 0,
            costeMerito: [50, 100],
            desbloqueado: false,
            requisitos: ['reflexes', 'titan'],
            tier: 4
        }
    ]
};

let gameState = null;

// Inicialización
function init() {
    loadGameState();
    renderTree();
    updateMeritDisplay();
    setupEventListeners();

    // Pequeño retardo para asegurar que los nodos estén renderizados antes de dibujar las líneas
    setTimeout(drawLines, 50);
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

    // Recalcular estado de desbloqueo basado en los requisitos
    recalculateUnlockedStates();
}

// Guardar estado en localStorage
function saveGameState() {
    localStorage.setItem('skillTreeState', JSON.stringify(gameState));
}

// Actualizar estados "desbloqueado" según los requisitos
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

// Obtener coste actual
function getCurrentCost(trait) {
    if (trait.nivel >= 2) return "MÁXIMO";
    return trait.costeMerito[trait.nivel] + " Mérito";
}

// Renderizar el árbol
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
            node.dataset.id = trait.id;

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
            node.addEventListener('click', () => handleNodeClick(trait.id));

            tierDiv.appendChild(node);
        });

        container.appendChild(tierDiv);
    });
}

// Manejar clic en un nodo
function handleNodeClick(traitId) {
    const trait = gameState.traits.find(t => t.id === traitId);

    if (!trait) return;

    // Si no está desbloqueado, no se puede interactuar
    if (!trait.desbloqueado) {
        // Podríamos mostrar un mensaje de error si se desea
        return;
    }

    // Si ya está al máximo
    if (trait.nivel >= 2) {
        return;
    }

    const cost = trait.costeMerito[trait.nivel];

    // Verificar si hay mérito suficiente
    if (gameState.merit >= cost) {
        // Restar mérito
        gameState.merit -= cost;

        // Subir nivel
        trait.nivel++;

        // Recalcular qué habilidades se han desbloqueado
        recalculateUnlockedStates();

        // Guardar progreso
        saveGameState();

        // Actualizar interfaz
        updateMeritDisplay();
        renderTree();

        // Pequeño retardo para redibujar las líneas después del render
        setTimeout(drawLines, 50);
    } else {
        // Efecto visual de no poder comprar (opcional)
        const nodeEl = document.getElementById(`node-${trait.id}`);
        if (nodeEl) {
            nodeEl.style.transform = "translateX(-5px)";
            setTimeout(() => nodeEl.style.transform = "translateX(5px)", 100);
            setTimeout(() => nodeEl.style.transform = "translateX(0)", 200);
        }
    }
}

// Actualizar visualización de mérito
function updateMeritDisplay() {
    document.getElementById('merit-count').textContent = gameState.merit;
}

// Configurar otros event listeners
function setupEventListeners() {
    // Botón añadir mérito
    document.getElementById('add-merit-btn').addEventListener('click', () => {
        gameState.merit += 10;
        saveGameState();
        updateMeritDisplay();
    });

    // Botón reiniciar progreso
    document.getElementById('reset-btn').addEventListener('click', () => {
        if(confirm("¿Estás seguro de que deseas reiniciar todo el progreso?")) {
            localStorage.removeItem('skillTreeState');
            location.reload();
        }
    });

    // Resize para redibujar las líneas
    window.addEventListener('resize', drawLines);
}

// Dibujar líneas conectoras
function drawLines() {
    const svg = document.getElementById('connections-svg');
    svg.innerHTML = ''; // Limpiar líneas anteriores

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

                // Usar una curva de bezier cúbica para que sea más elegante
                // M = move to (inicio), C = bezier curve (control1, control2, fin)
                const pathData = `M ${startX} ${startY} C ${startX} ${startY + 40}, ${endX} ${endY - 40}, ${endX} ${endY}`;
                line.setAttribute("d", pathData);

                // Determinar estado de la línea
                const reqTrait = gameState.traits.find(t => t.id === reqId);
                const isReqMet = reqTrait && reqTrait.nivel > 0;

                // Una línea es "activa" si el requisito está cumplido y el nodo destino está desbloqueado o ya tiene nivel
                const isActive = isReqMet && (trait.desbloqueado || trait.nivel > 0);

                line.setAttribute("class", `connection-line ${isActive ? 'active' : 'inactive'}`);
                line.setAttribute("fill", "none");

                svg.appendChild(line);
            });
        }
    });
}

// Iniciar aplicación al cargar
document.addEventListener('DOMContentLoaded', init);
