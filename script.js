// Estructura de Datos Global
let appState = {
    players: [],
    currentPlayerId: null
};

// Plantilla de nuevo jugador (ahora con atributos D&D)
function createNewPlayer(name, currencyName) {
    return {
        id: 'player_' + Date.now(),
        name: name || 'Jugador 1',
        currencyName: currencyName || 'Mérito',
        currencyAmount: 0,
        attributes: {
            str: 10, // Fuerza
            dex: 10, // Destreza
            con: 10, // Constitución
            int: 10, // Inteligencia
            wis: 10, // Sabiduría
            cha: 10  // Carisma
        },
        traits: [],
        estados: []
    };
}

// Mapeo amigable de atributos
const attrNames = {
    str: 'Fuerza',
    dex: 'Destreza',
    con: 'Constitución',
    int: 'Inteligencia',
    wis: 'Sabiduría',
    cha: 'Carisma'
};

let isEditMode = false;
let editingItem = null;

// ==========================================
// INICIALIZACIÓN Y GUARDADO
// ==========================================
function init() {
    loadAppState();

    // Auto-crear un jugador inicial si la lista está completamente vacía
    if (appState.players.length === 0) {
        const defaultPlayer = createNewPlayer("Jugador 1", "Mérito");
        appState.players.push(defaultPlayer);
        appState.currentPlayerId = defaultPlayer.id;
        saveAppState();
    }

    renderSidebar();

    // Seleccionar el jugador actual (o el primero)
    if (appState.currentPlayerId && appState.players.find(p => p.id === appState.currentPlayerId)) {
        selectPlayer(appState.currentPlayerId);
    } else if (appState.players.length > 0) {
        selectPlayer(appState.players[0].id);
    }

    setupEventListeners();
}

function loadAppState() {
    const saved = localStorage.getItem('skillTreeAdminState');
    if (saved) {
        try {
            appState = JSON.parse(saved);
            // Asegurar que jugadores viejos tengan objeto de atributos
            appState.players.forEach(p => {
                if (!p.attributes) {
                    p.attributes = { str:10, dex:10, con:10, int:10, wis:10, cha:10 };
                }
            });
        } catch (e) {
            console.error("Error parsing saved state", e);
        }
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
        renderAttributes();
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
    if (confirm("¿Seguro que deseas eliminar este jugador?")) {
        appState.players = appState.players.filter(p => p.id !== id);
        if (appState.currentPlayerId === id) {
            appState.currentPlayerId = appState.players.length > 0 ? appState.players[0].id : null;
        }
        saveAppState();
        renderSidebar();
        selectPlayer(appState.currentPlayerId);
    }
}

// ==========================================
// RENDER: ATRIBUTOS (D&D)
// ==========================================
function renderAttributes() {
    const player = getCurrentPlayer();
    if (!player) return;

    const container = document.getElementById('attributes-container');
    container.innerHTML = '';

    Object.keys(player.attributes).forEach(key => {
        const val = player.attributes[key];
        const attrName = attrNames[key];

        const card = document.createElement('div');
        card.className = 'attr-card';
        card.innerHTML = `
            <div class="attr-name">${attrName}</div>
            <div class="attr-value" id="val-${key}">${val}</div>
            <div class="attr-controls">
                <button class="btn-attr" onclick="changeAttr('${key}', -1)">-</button>
                <button class="btn-attr" onclick="changeAttr('${key}', 1)">+</button>
            </div>
        `;
        container.appendChild(card);
    });
}

window.changeAttr = function(key, delta) {
    if (!isEditMode) return;
    const player = getCurrentPlayer();
    if (!player) return;

    player.attributes[key] += delta;
    if(player.attributes[key] < 1) player.attributes[key] = 1; // Mínimo 1

    document.getElementById(`val-${key}`).textContent = player.attributes[key];
    saveAppState();

    // Al cambiar un atributo, puede que se desbloqueen o bloqueen cosas
    recalculateUnlockedStates(player);
    renderTree();
    renderStates();
    if (document.getElementById('tab-rasgos').classList.contains('active')) setTimeout(drawLines, 50);
};

// ==========================================
// LÓGICA DEL ÁRBOL Y ESTADOS
// ==========================================
function recalculateUnlockedStates(player) {
    // Para Rasgos
    player.traits.forEach(trait => {
        // 1. Verificar Requisitos de Árbol (Padres)
        let parentsMet = true;
        if (trait.requisitos && trait.requisitos.length > 0) {
            parentsMet = trait.requisitos.every(reqId => {
                const reqTrait = player.traits.find(t => t.id === reqId);
                return reqTrait && reqTrait.nivel > 0;
            });
        }

        // 2. Verificar Requisitos de Atributo D&D
        let attrMet = true;
        trait.reqAttrFailMsg = null;
        if (trait.reqAttr && trait.reqAttr.key && trait.reqAttr.val) {
            const currentVal = player.attributes[trait.reqAttr.key] || 0;
            if (currentVal < trait.reqAttr.val) {
                attrMet = false;
                trait.reqAttrFailMsg = `Requiere ${attrNames[trait.reqAttr.key]} ${trait.reqAttr.val}`;
            }
        }

        trait.desbloqueado = parentsMet && attrMet;
    });

    // Para Estados (Solo Requisitos D&D)
    player.estados.forEach(estado => {
        let attrMet = true;
        estado.reqAttrFailMsg = null;
        if (estado.reqAttr && estado.reqAttr.key && estado.reqAttr.val) {
            const currentVal = player.attributes[estado.reqAttr.key] || 0;
            if (currentVal < estado.reqAttr.val) {
                attrMet = false;
                estado.reqAttrFailMsg = `Requiere ${attrNames[estado.reqAttr.key]} ${estado.reqAttr.val}`;
            }
        }
        estado.desbloqueado = attrMet;
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

            // Mostrar por qué está bloqueado si es por atributos
            let warningHtml = '';
            if (!trait.desbloqueado && trait.reqAttrFailMsg && trait.nivel === 0) {
                warningHtml = `<div class="req-warning">${trait.reqAttrFailMsg}</div>`;
            }

            const badge = `<div class="edit-badge">✎</div>`;

            node.innerHTML = `
                ${badge}
                <div class="node-name">${name}</div>
                <div class="node-cost">${costText}</div>
                ${warningHtml}
                ${descHtml}
            `;

            node.addEventListener('click', () => {
                if (isEditMode) openModalTrait(trait);
                else handleUpgrade(trait, 'trait', `node-${trait.id}`);
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
        else if (estado.desbloqueado) card.classList.add('unlocked');
        else card.classList.add('locked');

        const name = estado.nombreBase + getLevelSuffix(estado.nivel);
        const costText = getCurrentCost(estado);
        const descText = estado.descripcion || '';

        let warningHtml = '';
        if (!estado.desbloqueado && estado.reqAttrFailMsg && estado.nivel === 0) {
            warningHtml = `<div class="req-warning">${estado.reqAttrFailMsg}</div>`;
        }

        const badge = `<div class="edit-badge">✎</div>`;

        card.innerHTML = `
            ${badge}
            <div class="state-name">${name}</div>
            <div class="state-cost">${costText}</div>
            ${warningHtml}
            ${descText ? `<div class="state-desc">${descText}</div>` : ''}
        `;

        card.addEventListener('click', () => {
            if (isEditMode) openModalState(estado);
            else handleUpgrade(estado, 'state', `state-${estado.id}`);
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

    if (!item.desbloqueado || item.nivel >= 2) {
        shakeElement(elementId); return;
    }

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
                // La línea se pinta activa si el padre se cumplió, sin importar el requisito de atributo.
                const isActive = isReqMet && (trait.nivel > 0 || trait.desbloqueado);

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
    const tbAtributos = document.getElementById('toolbar-atributos');

    if (isEditMode) {
        body.classList.add('edit-mode');
        modeLabel.textContent = "Modo Edición";
        tbRasgos.style.display = 'flex';
        tbEstados.style.display = 'flex';
        tbAtributos.style.display = 'block';
    } else {
        body.classList.remove('edit-mode');
        modeLabel.textContent = "Modo Juego";
        tbRasgos.style.display = 'none';
        tbEstados.style.display = 'none';
        tbAtributos.style.display = 'none';
    }
}

function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); editingItem = null; }

// Modal Jugador
document.getElementById('btn-add-player').onclick = () => {
    editingItem = null;
    document.getElementById('input-player-name').value = '';
    document.getElementById('input-currency-name').value = 'Puntos de Atributo';
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
        editingItem.name = name;
        editingItem.currencyName = curr;
    } else {
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
    document.getElementById('select-trait-req-attr').value = '';
    document.getElementById('input-trait-req-attr-val').value = '10';
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
    if (trait.requisitos && trait.requisitos.length > 0) reqSelect.value = trait.requisitos[0];
    else reqSelect.value = "";

    if (trait.reqAttr) {
        document.getElementById('select-trait-req-attr').value = trait.reqAttr.key || '';
        document.getElementById('input-trait-req-attr-val').value = trait.reqAttr.val || 10;
    } else {
        document.getElementById('select-trait-req-attr').value = '';
        document.getElementById('input-trait-req-attr-val').value = 10;
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

    const reqAttrKey = document.getElementById('select-trait-req-attr').value;
    const reqAttrVal = parseInt(document.getElementById('input-trait-req-attr-val').value) || 1;
    const reqAttrObj = reqAttrKey ? { key: reqAttrKey, val: reqAttrVal } : null;

    if (editingItem) {
        editingItem.nombreBase = name;
        editingItem.descripcion = desc;
        editingItem.costeMerito = [c1, c2];
        editingItem.tier = tier;
        editingItem.requisitos = req ? [req] : [];
        editingItem.reqAttr = reqAttrObj;
    } else {
        const newTrait = {
            id: 'trait_' + Date.now(),
            nombreBase: name,
            descripcion: desc,
            nivel: 0,
            costeMerito: [c1, c2],
            requisitos: req ? [req] : [],
            tier: tier,
            reqAttr: reqAttrObj
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
        player.traits.forEach(t => {
            if(t.requisitos) t.requisitos = t.requisitos.filter(r => r !== editingItem.id);
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
    document.getElementById('select-state-req-attr').value = '';
    document.getElementById('input-state-req-attr-val').value = '10';
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

    if (estado.reqAttr) {
        document.getElementById('select-state-req-attr').value = estado.reqAttr.key || '';
        document.getElementById('input-state-req-attr-val').value = estado.reqAttr.val || 10;
    } else {
        document.getElementById('select-state-req-attr').value = '';
        document.getElementById('input-state-req-attr-val').value = 10;
    }

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

    const reqAttrKey = document.getElementById('select-state-req-attr').value;
    const reqAttrVal = parseInt(document.getElementById('input-state-req-attr-val').value) || 1;
    const reqAttrObj = reqAttrKey ? { key: reqAttrKey, val: reqAttrVal } : null;

    if (editingItem) {
        editingItem.nombreBase = name;
        editingItem.descripcion = desc;
        editingItem.costeMerito = [c1, c2];
        editingItem.reqAttr = reqAttrObj;
    } else {
        const newState = {
            id: 'state_' + Date.now(),
            nombreBase: name,
            descripcion: desc,
            nivel: 0,
            costeMerito: [c1, c2],
            reqAttr: reqAttrObj
        };
        if(!player.estados) player.estados = [];
        player.estados.push(newState);
    }

    recalculateUnlockedStates(player);
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
    document.getElementById('btn-add-currency').addEventListener('click', () => {
        const player = getCurrentPlayer();
        if (player) {
            player.currencyAmount += 10;
            saveAppState();
            updateCurrencyDisplay();
        }
    });

    document.getElementById('mode-toggle').addEventListener('change', (e) => {
        isEditMode = e.target.checked;
        updateEditModeUI();
    });

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

// Lógica para Menú Móvil
document.addEventListener('DOMContentLoaded', () => {
    const btnOpen = document.getElementById('btn-open-sidebar');
    const btnClose = document.getElementById('btn-close-sidebar');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    if (btnOpen && btnClose && sidebar && overlay) {
        function openSidebar() {
            sidebar.classList.add('open');
            overlay.classList.add('active');
        }

        function closeSidebar() {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        }

        btnOpen.addEventListener('click', openSidebar);
        btnClose.addEventListener('click', closeSidebar);
        overlay.addEventListener('click', closeSidebar);

        // Modificar selectPlayer global para que cierre el sidebar en móviles
        const originalSelectPlayer = selectPlayer;
        window.selectPlayer = function(id) {
            originalSelectPlayer(id);
            if (window.innerWidth <= 768) {
                closeSidebar();
            }
        };
    }
});
