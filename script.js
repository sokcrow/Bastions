// Estructura de Datos Global
let appState = {
    players: [], // Array de objetos jugador
    currentPlayerId: null
};

// Plantilla de nuevo jugador
function createNewPlayer(name, currencyName) {
    return {
        id: 'player_' + Date.now(),
        name: name || 'Nuevo Jugador',
        currencyName: currencyName || 'Mérito',
        currencyAmount: 0,
        traits: [],
        estados: []
    };
}

let isEditMode = false;
let editingItem = null; // Guarda temporalmente el item siendo editado en el modal

// ==========================================
// INICIALIZACIÓN Y GUARDADO
// ==========================================
function init() {
    loadAppState();
    renderSidebar();

    if (appState.currentPlayerId) {
        selectPlayer(appState.currentPlayerId);
    } else {
        showEmptyState();
    }

    setupEventListeners();
}

function loadAppState() {
    const saved = localStorage.getItem('skillTreeAdminState');
    if (saved) {
        try {
            appState = JSON.parse(saved);
        } catch (e) {
            console.error("Error parsing saved state", e);
        }
    }

    // Migración de datos viejos si existe 'skillTreeState'
    const oldState = localStorage.getItem('skillTreeState');
    if (oldState && appState.players.length === 0) {
        try {
            const oldData = JSON.parse(oldState);
            const migratedPlayer = createNewPlayer("Jugador Heredado", "Mérito");
            migratedPlayer.currencyAmount = oldData.merit || 0;
            migratedPlayer.traits = oldData.traits || [];
            migratedPlayer.estados = oldData.estados || [];
            appState.players.push(migratedPlayer);
            appState.currentPlayerId = migratedPlayer.id;
            localStorage.removeItem('skillTreeState'); // Limpiar el viejo
        } catch(e){}
    }
}

function saveAppState() {
    localStorage.setItem('skillTreeAdminState', JSON.stringify(appState));
}

function getCurrentPlayer() {
    return appState.players.find(p => p.id === appState.currentPlayerId);
}

// ==========================================
// UI: SIDEBAR Y ESTADO PRINCIPAL
// ==========================================
function renderSidebar() {
    const list = document.getElementById('players-list');
    list.innerHTML = '';

    appState.players.forEach(player => {
        const li = document.createElement('li');
        li.className = `player-item ${player.id === appState.currentPlayerId ? 'active' : ''}`;

        const nameSpan = document.createElement('span');
        nameSpan.textContent = player.name;
        nameSpan.onclick = () => selectPlayer(player.id);

        const delBtn = document.createElement('button');
        delBtn.className = 'player-delete';
        delBtn.innerHTML = '×';
        delBtn.title = "Eliminar jugador";
        delBtn.onclick = (e) => {
            e.stopPropagation();
            deletePlayer(player.id);
        };

        li.appendChild(nameSpan);
        li.appendChild(delBtn);
        list.appendChild(li);
    });
}

function selectPlayer(id) {
    appState.currentPlayerId = id;
    saveAppState();
    renderSidebar();

    const player = getCurrentPlayer();
    if (player) {
        document.getElementById('empty-state').style.display = 'none';
        document.getElementById('currency-container').style.display = 'flex';
        document.getElementById('tabs-container').style.display = 'flex';
        document.getElementById('content-container').style.display = 'flex';

        document.getElementById('current-player-name').textContent = player.name;
        document.getElementById('currency-name').textContent = player.currencyName;

        updateCurrencyDisplay();
        recalculateUnlockedStates(player);
        renderTree();
        renderStates();
        updateEditModeUI();

        if (document.getElementById('tab-rasgos').classList.contains('active')) {
            setTimeout(drawLines, 50);
        }
    } else {
        showEmptyState();
    }
}

function showEmptyState() {
    document.getElementById('empty-state').style.display = 'flex';
    document.getElementById('currency-container').style.display = 'none';
    document.getElementById('tabs-container').style.display = 'none';
    document.getElementById('content-container').style.display = 'none';
    document.getElementById('current-player-name').textContent = "Selecciona un Jugador";
}

function updateCurrencyDisplay() {
    const player = getCurrentPlayer();
    if (player) {
        document.getElementById('currency-count').textContent = player.currencyAmount;
    }
}

function deletePlayer(id) {
    if (confirm("¿Seguro que deseas eliminar este jugador y todo su progreso?")) {
        appState.players = appState.players.filter(p => p.id !== id);
        if (appState.currentPlayerId === id) {
            appState.currentPlayerId = null;
        }
        saveAppState();
        renderSidebar();
        selectPlayer(appState.currentPlayerId);
    }
}

// ==========================================
// LÓGICA DEL ÁRBOL Y ESTADOS
// ==========================================
function recalculateUnlockedStates(player) {
    player.traits.forEach(trait => {
        if (!trait.requisitos || trait.requisitos.length === 0) {
            trait.desbloqueado = true;
        } else {
            const allReqsMet = trait.requisitos.every(reqId => {
                const reqTrait = player.traits.find(t => t.id === reqId);
                return reqTrait && reqTrait.nivel > 0;
            });
            trait.desbloqueado = allReqsMet;
        }
    });
}

function getLevelSuffix(nivel) {
    if (nivel === 1) return "+";
    if (nivel === 2) return "++";
    return "";
}

function getCurrentCost(item) {
    if (item.nivel >= 2) return "MÁXIMO";
    const costArray = item.costeMerito || [0,0];
    const cost = costArray[item.nivel] || 0;
    const player = getCurrentPlayer();
    return cost + " " + (player ? player.currencyName : "");
}

// ==========================================
// RENDER: RASGOS (ÁRBOL)
// ==========================================
function renderTree() {
    const player = getCurrentPlayer();
    if (!player) return;

    const container = document.getElementById('nodes-container');
    container.innerHTML = '';

    const tiers = {};
    player.traits.forEach(trait => {
        const t = trait.tier || 1;
        if (!tiers[t]) tiers[t] = [];
        tiers[t].push(trait);
    });

    const sortedTiers = Object.keys(tiers).sort((a, b) => parseInt(a) - parseInt(b));

    sortedTiers.forEach(tierKey => {
        const tierDiv = document.createElement('div');
        tierDiv.className = 'tier';

        tiers[tierKey].forEach(trait => {
            const node = document.createElement('div');
            node.className = 'node';
            node.id = `node-${trait.id}`;

            if (trait.nivel === 2) node.classList.add('maxed');
            else if (trait.desbloqueado) node.classList.add('unlocked');
            else node.classList.add('locked');

            const name = trait.nombreBase + getLevelSuffix(trait.nivel);
            const costText = getCurrentCost(trait);
            const descHtml = trait.descripcion ? `<div class="state-desc" style="display:none">${trait.descripcion}</div>` : '';

            // Badge para edición
            const badge = `<div class="edit-badge">✎</div>`;

            node.innerHTML = `
                ${badge}
                <div class="node-name">${name}</div>
                <div class="node-cost">${costText}</div>
                ${descHtml}
            `;

            // Comportamiento según el modo
            node.addEventListener('click', (e) => {
                if (isEditMode) {
                    openModalTrait(trait);
                } else {
                    handleUpgrade(trait, 'trait', `node-${trait.id}`);
                }
            });

            tierDiv.appendChild(node);
        });

        container.appendChild(tierDiv);
    });
}

// ==========================================
// RENDER: ESTADOS (GRID)
// ==========================================
function renderStates() {
    const player = getCurrentPlayer();
    if (!player) return;

    const container = document.getElementById('states-container');
    container.innerHTML = '';

    if (!player.estados || player.estados.length === 0) {
        container.innerHTML = '<p style="color:#aaa; grid-column: 1/-1;">No hay estados definidos.</p>';
        return;
    }

    player.estados.forEach(estado => {
        const card = document.createElement('div');
        card.className = 'state-card';
        card.id = `state-${estado.id}`;

        if (estado.nivel === 2) card.classList.add('maxed');
        else if (estado.desbloqueado !== false) card.classList.add('unlocked');
        else card.classList.add('locked');

        const name = estado.nombreBase + getLevelSuffix(estado.nivel);
        const costText = getCurrentCost(estado);
        const descText = estado.descripcion || '';

        const badge = `<div class="edit-badge">✎</div>`;

        card.innerHTML = `
            ${badge}
            <div class="state-name">${name}</div>
            <div class="state-cost">${costText}</div>
            ${descText ? `<div class="state-desc">${descText}</div>` : ''}
        `;

        card.addEventListener('click', () => {
            if (isEditMode) {
                openModalState(estado);
            } else {
                handleUpgrade(estado, 'state', `state-${estado.id}`);
            }
        });

        container.appendChild(card);
    });
}

// ==========================================
// LÓGICA DE JUEGO (COMPRAS)
// ==========================================
function handleUpgrade(item, type, elementId) {
    const player = getCurrentPlayer();
    if (!player) return;

    // Validaciones
    if ((type === 'trait' && !item.desbloqueado) || (type==='state' && item.desbloqueado === false)) {
        shakeElement(elementId); return;
    }
    if (item.nivel >= 2) return;

    const costArray = item.costeMerito || [0,0];
    const cost = costArray[item.nivel] || 0;

    if (player.currencyAmount >= cost) {
        player.currencyAmount -= cost;
        item.nivel++;

        if (type === 'trait') {
            recalculateUnlockedStates(player);
            renderTree();
            if (document.getElementById('tab-rasgos').classList.contains('active')) setTimeout(drawLines, 50);
        } else {
            renderStates();
        }

        saveAppState();
        updateCurrencyDisplay();
    } else {
        shakeElement(elementId);
    }
}

function shakeElement(id) {
    const el = document.getElementById(id);
    if (el) {
        el.style.transform = "translateX(-5px)";
        setTimeout(() => el.style.transform = "translateX(5px)", 100);
        setTimeout(() => el.style.transform = "translateX(0)", 200);
    }
}

// ==========================================
// SVG LINES
// ==========================================
function drawLines() {
    const svg = document.getElementById('connections-svg');
    if (!svg) return;
    svg.innerHTML = '';

    if (!document.getElementById('tab-rasgos').classList.contains('active')) return;

    const player = getCurrentPlayer();
    if (!player) return;

    player.traits.forEach(trait => {
        if (trait.requisitos && trait.requisitos.length > 0) {
            const targetNode = document.getElementById(`node-${trait.id}`);
            if (!targetNode) return;

            trait.requisitos.forEach(reqId => {
                const sourceNode = document.getElementById(`node-${reqId}`);
                if (!sourceNode) return;

                const sourceRect = sourceNode.getBoundingClientRect();
                const targetRect = targetNode.getBoundingClientRect();
                const svgRect = svg.getBoundingClientRect();

                const startX = sourceRect.left + sourceRect.width / 2 - svgRect.left;
                const startY = sourceRect.bottom - svgRect.top;
                const endX = targetRect.left + targetRect.width / 2 - svgRect.left;
                const endY = targetRect.top - svgRect.top;

                const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
                const pathData = `M ${startX} ${startY} C ${startX} ${startY + 40}, ${endX} ${endY - 40}, ${endX} ${endY}`;
                line.setAttribute("d", pathData);

                const reqTrait = player.traits.find(t => t.id === reqId);
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
// MODO EDICIÓN Y MODALES
// ==========================================
function updateEditModeUI() {
    const body = document.body;
    const modeLabel = document.getElementById('mode-label');
    const tbRasgos = document.getElementById('toolbar-rasgos');
    const tbEstados = document.getElementById('toolbar-estados');

    if (isEditMode) {
        body.classList.add('edit-mode');
        modeLabel.textContent = "Modo Edición";
        tbRasgos.style.display = 'flex';
        tbEstados.style.display = 'flex';
    } else {
        body.classList.remove('edit-mode');
        modeLabel.textContent = "Modo Juego";
        tbRasgos.style.display = 'none';
        tbEstados.style.display = 'none';
    }
}

function openModal(id) {
    document.getElementById(id).classList.add('active');
}
function closeModal(id) {
    document.getElementById(id).classList.remove('active');
    editingItem = null;
}

// Modal Jugador
document.getElementById('btn-add-player').onclick = () => {
    editingItem = null;
    document.getElementById('input-player-name').value = '';
    document.getElementById('input-currency-name').value = 'Puntos';
    document.getElementById('modal-player-title').textContent = "Nuevo Jugador";
    openModal('modal-player');
};
document.getElementById('btn-edit-player').onclick = () => {
    const player = getCurrentPlayer();
    if (!player) return;
    editingItem = player;
    document.getElementById('input-player-name').value = player.name;
    document.getElementById('input-currency-name').value = player.currencyName;
    document.getElementById('modal-player-title').textContent = "Editar Jugador";
    openModal('modal-player');
};
document.getElementById('btn-save-player').onclick = () => {
    const name = document.getElementById('input-player-name').value.trim() || 'Jugador';
    const curr = document.getElementById('input-currency-name').value.trim() || 'Moneda';

    if (editingItem && appState.players.find(p => p.id === editingItem.id)) {
        // Editando
        editingItem.name = name;
        editingItem.currencyName = curr;
    } else {
        // Nuevo
        const newP = createNewPlayer(name, curr);
        appState.players.push(newP);
        appState.currentPlayerId = newP.id;
    }
    saveAppState();
    renderSidebar();
    selectPlayer(appState.currentPlayerId);
    closeModal('modal-player');
};

// Modal Rasgos
function populateReqSelect(currentPlayer, currentTraitId) {
    const select = document.getElementById('select-trait-req');
    select.innerHTML = '<option value="">Ninguno (Nodo Raíz)</option>';
    if (!currentPlayer) return;

    currentPlayer.traits.forEach(t => {
        // Un rasgo no puede depender de sí mismo
        if (t.id !== currentTraitId) {
            const opt = document.createElement('option');
            opt.value = t.id;
            opt.textContent = t.nombreBase;
            select.appendChild(opt);
        }
    });
}

document.getElementById('btn-add-trait').onclick = () => {
    editingItem = null;
    document.getElementById('modal-trait-title').textContent = "Nuevo Rasgo";
    document.getElementById('input-trait-name').value = '';
    document.getElementById('input-trait-desc').value = '';
    document.getElementById('input-trait-cost1').value = '10';
    document.getElementById('input-trait-cost2').value = '20';
    document.getElementById('select-trait-tier').value = '1';
    document.getElementById('btn-delete-trait').style.display = 'none';

    populateReqSelect(getCurrentPlayer(), null);
    openModal('modal-trait');
};

function openModalTrait(trait) {
    editingItem = trait;
    document.getElementById('modal-trait-title').textContent = "Editar Rasgo";
    document.getElementById('input-trait-name').value = trait.nombreBase;
    document.getElementById('input-trait-desc').value = trait.descripcion || '';

    const costs = trait.costeMerito || [10,20];
    document.getElementById('input-trait-cost1').value = costs[0];
    document.getElementById('input-trait-cost2').value = costs[1];

    document.getElementById('select-trait-tier').value = trait.tier || 1;

    populateReqSelect(getCurrentPlayer(), trait.id);
    const reqSelect = document.getElementById('select-trait-req');
    if (trait.requisitos && trait.requisitos.length > 0) {
        reqSelect.value = trait.requisitos[0];
    } else {
        reqSelect.value = "";
    }

    document.getElementById('btn-delete-trait').style.display = 'block';
    openModal('modal-trait');
}

document.getElementById('btn-save-trait').onclick = () => {
    const player = getCurrentPlayer();
    if (!player) return;

    const name = document.getElementById('input-trait-name').value.trim() || 'Nuevo Rasgo';
    const desc = document.getElementById('input-trait-desc').value.trim();
    const c1 = parseInt(document.getElementById('input-trait-cost1').value) || 0;
    const c2 = parseInt(document.getElementById('input-trait-cost2').value) || 0;
    const tier = parseInt(document.getElementById('select-trait-tier').value) || 1;
    const req = document.getElementById('select-trait-req').value;

    if (editingItem) {
        editingItem.nombreBase = name;
        editingItem.descripcion = desc;
        editingItem.costeMerito = [c1, c2];
        editingItem.tier = tier;
        editingItem.requisitos = req ? [req] : [];
    } else {
        const newTrait = {
            id: 'trait_' + Date.now(),
            nombreBase: name,
            descripcion: desc,
            nivel: 0,
            costeMerito: [c1, c2],
            desbloqueado: !req,
            requisitos: req ? [req] : [],
            tier: tier
        };
        player.traits.push(newTrait);
    }

    recalculateUnlockedStates(player);
    saveAppState();
    renderTree();
    setTimeout(drawLines, 50);
    closeModal('modal-trait');
};

document.getElementById('btn-delete-trait').onclick = () => {
    const player = getCurrentPlayer();
    if (!player || !editingItem) return;
    if (confirm("¿Eliminar rasgo? Los hijos que dependan de él podrían romperse.")) {
        player.traits = player.traits.filter(t => t.id !== editingItem.id);

        // Limpiar dependencias huerfanas
        player.traits.forEach(t => {
            if(t.requisitos) {
                t.requisitos = t.requisitos.filter(r => r !== editingItem.id);
            }
        });

        recalculateUnlockedStates(player);
        saveAppState();
        renderTree();
        setTimeout(drawLines, 50);
        closeModal('modal-trait');
    }
};

// Modal Estados
document.getElementById('btn-add-state').onclick = () => {
    editingItem = null;
    document.getElementById('modal-state-title').textContent = "Nuevo Estado";
    document.getElementById('input-state-name').value = '';
    document.getElementById('input-state-desc').value = '';
    document.getElementById('input-state-cost1').value = '10';
    document.getElementById('input-state-cost2').value = '20';
    document.getElementById('btn-delete-state').style.display = 'none';
    openModal('modal-state');
};

function openModalState(estado) {
    editingItem = estado;
    document.getElementById('modal-state-title').textContent = "Editar Estado";
    document.getElementById('input-state-name').value = estado.nombreBase;
    document.getElementById('input-state-desc').value = estado.descripcion || '';

    const costs = estado.costeMerito || [10,20];
    document.getElementById('input-state-cost1').value = costs[0];
    document.getElementById('input-state-cost2').value = costs[1];

    document.getElementById('btn-delete-state').style.display = 'block';
    openModal('modal-state');
}

document.getElementById('btn-save-state').onclick = () => {
    const player = getCurrentPlayer();
    if (!player) return;

    const name = document.getElementById('input-state-name').value.trim() || 'Nuevo Estado';
    const desc = document.getElementById('input-state-desc').value.trim();
    const c1 = parseInt(document.getElementById('input-state-cost1').value) || 0;
    const c2 = parseInt(document.getElementById('input-state-cost2').value) || 0;

    if (editingItem) {
        editingItem.nombreBase = name;
        editingItem.descripcion = desc;
        editingItem.costeMerito = [c1, c2];
    } else {
        const newState = {
            id: 'state_' + Date.now(),
            nombreBase: name,
            descripcion: desc,
            nivel: 0,
            costeMerito: [c1, c2],
            desbloqueado: true
        };
        if(!player.estados) player.estados = [];
        player.estados.push(newState);
    }

    saveAppState();
    renderStates();
    closeModal('modal-state');
};

document.getElementById('btn-delete-state').onclick = () => {
    const player = getCurrentPlayer();
    if (!player || !editingItem) return;
    if (confirm("¿Eliminar estado?")) {
        player.estados = player.estados.filter(s => s.id !== editingItem.id);
        saveAppState();
        renderStates();
        closeModal('modal-state');
    }
};

// ==========================================
// EVENT LISTENERS GENERALES
// ==========================================
function setupEventListeners() {
    // Añadir moneda
    document.getElementById('btn-add-currency').addEventListener('click', () => {
        const player = getCurrentPlayer();
        if (player) {
            player.currencyAmount += 10;
            saveAppState();
            updateCurrencyDisplay();
        }
    });

    // Toggle Edit Mode
    document.getElementById('mode-toggle').addEventListener('change', (e) => {
        isEditMode = e.target.checked;
        updateEditModeUI();
    });

    // Tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');

            if (targetId === 'tab-rasgos') {
                setTimeout(drawLines, 50);
            }
        });
    });

    window.addEventListener('resize', () => {
        if (document.getElementById('tab-rasgos') && document.getElementById('tab-rasgos').classList.contains('active')) {
            drawLines();
        }
    });
}

// Arrancar
document.addEventListener('DOMContentLoaded', init);
